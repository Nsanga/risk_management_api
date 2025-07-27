const historyKRIModel = require("../models/historyKRI.model");
const Historique = require("../models/historyKRI.model");
const keyIndicatorSchema = require("../models/keyIndicator.model");

async function createHistoryKRI(req, res) {
  try {
    const tenantId = req.tenantId;
    const { idEntity, idKeyIndicator, ...rest } = req.body;

    if (!tenantId || !idEntity || !idKeyIndicator) {
      return res.status(400).json({
        statut: 400,
        message: "Le tenantId, idEntity et idKeyIndicator sont requis.",
      });
    }

    const entityData = await keyIndicatorSchema.findOne({ entity: idEntity, tenantId });

    if (!entityData) {
      return res.status(404).json({
        statut: 404,
        message: "Aucune donnée d'indicateur clé trouvée pour cette entité.",
      });
    }

    const indicatorIds = entityData.dataKeyIndicators.map(item => item._id);

    const histories = await historyKRIModel.find({
      idKeyIndicator: { $in: indicatorIds },
      tenantId
    });

    const historyMap = histories.reduce((acc, hist) => {
      const key = hist.idKeyIndicator.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(hist);
      return acc;
    }, {});

    const enrichedIndicators = entityData.dataKeyIndicators.map(indicator => ({
      ...(indicator.toObject?.() ?? indicator),
      history: historyMap[indicator._id.toString()] || [],
    }));

    const targetIndicator = enrichedIndicators.find(
      item => item._id.toString() === idKeyIndicator.toString()
    );

    const dataLength = targetIndicator?.history?.length || 0;

    const historique = new Historique({
      ...rest,
      tenantId,
      idKeyIndicator, // ✅ Ajout ici
      coutAnnually: `Q${dataLength === 4 ? dataLength : dataLength + 1},`,
    });

    await historique.save();

    res.status(201).json({
      statut: 201,
      message: "Historique KRI créé avec succès",
      data: historique,
    });

  } catch (error) {
    console.error("Erreur lors de la création de l'historique KRI :", error.message);
    res.status(500).json({
      error: "Erreur lors de la création du test: " + error.message,
    });
  }
}

async function getAllHistoriqueKri(req, res) {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Le tenantId est requis." });
    }

    const allHistorique = await Historique.find({ tenantId });

    res.status(200).json({
      statut: 200,
      message: "Actions récupérées avec succès",
      data: allHistorique,
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération de l'historique: " + error.message,
    });
  }
}

// async function getAllHistoriqueByIdKeyIndicator(req, res) {
//   try {
//     const historique = await Historique.find({
//       idKeyIndicator: req.body.idKeyIndicator,
//     });
//     // res.status(200).json(historique);
//     res.status(200).json({
//       statut: 200,
//       message: "Histique  liée au KRI",
//       data: historique,
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: "Erreur lors de la récupération de l'historique: " + error.message,
//     });
//   }
// }

async function getAllHistoriqueByIdKeyIndicator(req, res) {
  try {
    const tenantId = req.tenantId;
    const { idKeyIndicator } = req.body;

    if (!tenantId || !idKeyIndicator) {
      return res.status(400).json({
        message: "Le tenantId et idKeyIndicator sont requis.",
      });
    }

    const historique = await Historique.find({
      idKeyIndicator,
      tenantId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    let average = 0;
    if (historique.length > 0) {
      const numericValues = historique
        .map((item) => parseFloat(item.value))
        .filter((val) => !isNaN(val));

      const total = numericValues.reduce((sum, val) => sum + val, 0);
      average = numericValues.length > 0 ? total / numericValues.length : 0;
    }

    res.status(200).json({
      statut: 200,
      message: "Historique lié au KRI (5 derniers éléments)",
      data: {
        average,
        histories: historique,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération de l'historique: " + error.message,
    });
  }
}

async function updateHistoryKRI(req, res) {
  try {
    const tenantId = req.tenantId;
    const { idEntity, idKeyIndicator } = req.body;
    const { id } = req.params;

    if (!tenantId || !idEntity || !idKeyIndicator || !id) {
      return res.status(400).json({
        message: "Le tenantId, idEntity, idKeyIndicator et l'id de l'historique sont requis.",
      });
    }

    const entityData = await keyIndicatorSchema.findOne({ entity: idEntity, tenantId });
    if (!entityData) {
      return res.status(404).json({ message: "Entité introuvable." });
    }

    const indicatorIds = entityData.dataKeyIndicators.map((item) => item._id);

    const histories = await historyKRIModel.find({
      idKeyIndicator: { $in: indicatorIds },
      tenantId,
    });

    const historyMap = histories.reduce((acc, hist) => {
      const key = hist.idKeyIndicator.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(hist);
      return acc;
    }, {});

    const enrichedIndicators = entityData.dataKeyIndicators.map((indicator) => ({
      ...(indicator.toObject?.() ?? indicator),
      history: historyMap[indicator._id.toString()] || [],
    }));

    const selectedKRI = enrichedIndicators.find(
      (item) => item._id.toString() === idKeyIndicator.toString()
    );

    if (!selectedKRI) {
      return res.status(404).json({ message: "Indicateur clé introuvable." });
    }

    const dataLength = selectedKRI.history.length;
    const coutAnnually = `Q${dataLength === 4 ? dataLength : dataLength + 1},`;

    const updated = await historyKRIModel.findByIdAndUpdate(
      id,
      {
        ...req.body,
        coutAnnually,
        tenantId,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Historique non trouvé." });
    }

    res.status(200).json({
      statut: 200,
      message: "Historique KRI mis à jour avec succès",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      statut: 500,
      error: "Erreur lors de la mise à jour du test: " + error.message,
    });
  }
}

module.exports = {
  createHistoryKRI,
  getAllHistoriqueKri,
  getAllHistoriqueByIdKeyIndicator,
  updateHistoryKRI,
};