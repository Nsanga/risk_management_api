const Event = require("../models/event.model");
const EntityRiskControl = require("../models/entityRiskControl.model");
const KeyIndicator = require("../models/keyIndicator.model");
const Action = require("../models/action.model");
const UserProfile = require("../models/userProfile.model");
const ResponseService = require("./response.service");
const actionModel = require("../models/action.model");
const actionKRIModel = require("../models/actionKRI.model");
const entityRiskControlSchema = require("../models/entityRiskControl.model");
const keyIndicatorSchema = require("../models/keyIndicator.model");

const historyModel = require("../models/history.model");
const historyKRIModel = require("../models/historyKRI.model");

async function getStatistics(req, res) {
  try {
    const tenantId = req.body.tenantId;
    // 1. Stats sur les indicateurs clés
    const indicators = await KeyIndicator.find({tenantId});
    const indicatorsStats = {
      total: indicators.length,
      achieved: indicators.filter((i) => i.currentValue >= i.targetValue)
        .length,
      averageProgress:
        indicators.reduce(
          (acc, curr) => acc + curr.currentValue / curr.targetValue,
          0
        ) / indicators.length,
    };

    // 2. Stats sur les actions
    const actions = await Action.find({tenantId});
    const actionsStats = {
      total: actions.length,
      completed: actions.filter((a) => a.status === "Terminé").length,
      overdue: actions.filter(
        (a) => a.dueDate < new Date() && a.status !== "Terminé"
      ).length,
    };

    // 3. Risques couverts (en prenant entityId du requête)
    const entityRiskControls = await EntityRiskControl.find({
      entity: req.params.entityId,
      tenantId
    });
    const riskStats = {
      totalControls: entityRiskControls.length,
      averageEffectiveness:
        entityRiskControls.reduce(
          (acc, curr) => acc + (curr.effectiveness || 0),
          0
        ) / entityRiskControls.length,
    };

    // 4. Nouveau: Stats des profils
    const profiles = await UserProfile.find({tenantId}).populate({
      path: "entity",
      select: "referenceId description",
    });

    const profilesStats = {
      total: profiles.length,
      byEntity: profiles.reduce((acc, profile) => {
        const entityName = profile.entity?.referenceId || "Non assigné";
        acc[entityName] = (acc[entityName] || 0) + 1;
        return acc;
      }, {}),
      byStatus: {
        active: profiles.filter((p) => p.activeUser).length,
        inactive: profiles.filter((p) => !p.activeUser).length,
      },
    };

    const [totalAction, totalActionKRI] = await Promise.all([
      actionModel.find({tenantId}),
      actionKRIModel.find({tenantId}),
    ]);

    const statAction = {
      totalActionsRCSA: totalAction.length,
      totalActionsKRI: totalActionKRI.length,
      allAction: totalAction.length + totalActionKRI.length,
    };

    const entityRiskControl = await entityRiskControlSchema.find({tenantId});
    const kriRiskControl = await keyIndicatorSchema.find({tenantId});

    const allHistory = await historyModel.find({tenantId});
    const allHistoryKRI = await historyKRIModel.find({tenantId});

    const allControls = entityRiskControl.flatMap((item) => item.controls);
    const allKeyIndicators = kriRiskControl.flatMap(
      (item) => item.dataKeyIndicators
    );

    // console.log("====================================");
    // console.log("allKeyIndicators", allKeyIndicators);
    // console.log("====================================");

    // Enrichir chaque control avec son historique associé
    const allControlsWithHistory = allControls?.map((control) => {
      const relatedHistory = allHistory?.filter(
        (history) => history.idControl?.toString() === control._id.toString()
      );

      return {
        ...(control.toObject?.() || control), // pour être sûr que c’est un objet JS pur
        isTested: relatedHistory,
      };
    });

    // Enrichir chaque keyIndicator avec son historique associé
    const allkeyIndicatorsWithHistory = allKeyIndicators?.map(
      (keyIndicator) => {
        const relatedHistory = allHistoryKRI?.filter(
          (history) =>
            history.idKeyIndicator?.toString() === keyIndicator._id.toString()
        );

        return {
          ...(keyIndicator.toObject?.() || keyIndicator), // pour être sûr que c’est un objet JS pur
          isTested: relatedHistory,
        };
      }
    );

    const testedControls = allControlsWithHistory.filter(
      (c) => c.isTested.length > 0
    );

    const testedKeyIndicators = allkeyIndicatorsWithHistory.filter(
      (c) => c.isTested.length > 0
    );

    const testedPercentage =
      testedControls.length > 0
        ? (
            (testedControls.length / allControlsWithHistory.length) *
            100
          ).toFixed(2)
        : "0.00";

    const testedPercentageKeyIndicator =
      testedKeyIndicators.length > 0
        ? (
            (testedKeyIndicators.length / allkeyIndicatorsWithHistory.length) *
            100
          ).toFixed(2)
        : "0.00";

    const statKriOrRcsa = {
      totalControlsRCSA: allControls?.length,
      totalKRI: allControls?.length,
      nombreControlRcsaTested: testedControls.length,
      pourcentageControlRcsaTested: testedPercentage,
      nombreKeyIncatorTested: testedKeyIndicators.length,
      pourcentageKeyIncatorTested: testedPercentageKeyIndicator,

      // allControlsWithHistory: allControlsWithHistory,
      // allkeyIndicatorsWithHistory: allkeyIndicatorsWithHistory,
    };

    const allEvents = await Event.find({tenantId});
    const allFinancials = allEvents
      .map((item) => item?.financials)
      .filter(Boolean);

    // Calcul des totaux pour chaque catégorie
    const getFinancialTotal = (events) => {
      return events
        .map((event) => event?.financials?.totalConverted || 0)
        .reduce((acc, val) => acc + val, 0);
    };

    // Stats par statut d'approbation
    const approvedEvents = allEvents.filter((event) => event.approved === true);
    const rejectedEvents = allEvents.filter(
      (event) => event.approved === false
    );

    const eventsByStatus = {
      approved: {
        count: approvedEvents.length,
        totalAmount: getFinancialTotal(approvedEvents),
      },
      rejected: {
        count: rejectedEvents.length,
        totalAmount: getFinancialTotal(rejectedEvents),
      },
    };

    const allTotalConverted = allFinancials
      .map((item) => item.totalConverted || 0) // Utilise 0 si totalConverted est undefined/null
      .filter((total) => !isNaN(total)); // Filtre les valeurs non numériques (sécurité)

    const totalConverted = allTotalConverted.reduce((acc, val) => acc + val, 0);

    return ResponseService.success(res, {
      events: {
        byStatus: [
          {
            _id: "approved",
            count: eventsByStatus.approved.count,
            totalAmount: eventsByStatus.approved.totalAmount,
          },
          {
            _id: "rejected",
            count: eventsByStatus.rejected.count,
            totalAmount: eventsByStatus.rejected.totalAmount,
          },
        ],
        totalPerteSave: totalConverted,
        currency: "XAF",
      },
      indicators: indicatorsStats,
      actions: actionsStats,
      risks: riskStats,
      profiles: profilesStats,
      statAction: statAction,
      statKriOrRcsa: statKriOrRcsa,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

module.exports = {
  getStatistics,
};
