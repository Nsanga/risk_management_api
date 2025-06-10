const Event = require("../models/event.model");
const EntityRiskControl = require("../models/entityRiskControl.model");
const KeyIndicator = require("../models/keyIndicator.model");
const Action = require("../models/action.model");
const ResponseService = require("./response.service");

async function getStatistics(req, res) {
    try {
        // 1. Compter les événements par statut
        const eventsByStatus = await Event.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 2. Stats sur les indicateurs clés
        const indicators = await KeyIndicator.find();
        const indicatorsStats = {
            total: indicators.length,
            achieved: indicators.filter(i => i.currentValue >= i.targetValue).length,
            averageProgress: indicators.reduce((acc, curr) => acc + (curr.currentValue / curr.targetValue), 0) / indicators.length
        };

        // 3. Stats sur les actions
        const actions = await Action.find();
        const actionsStats = {
            total: actions.length,
            completed: actions.filter(a => a.status === 'Terminé').length,
            overdue: actions.filter(a => a.dueDate < new Date() && a.status !== 'Terminé').length
        };

        // 4. Risques couverts (en prenant entityId du requête)
        const entityRiskControls = await EntityRiskControl.find({ entity: req.params.entityId });
        const riskStats = {
            totalControls: entityRiskControls.length,
            averageEffectiveness: entityRiskControls.reduce((acc, curr) => acc + (curr.effectiveness || 0), 0) / entityRiskControls.length
        };

        // 5. Nouveau: Stats des profils
        const profiles = await UserProfile.find().populate({
            path: "entity",
            select: "referenceId description"
        });

        const profilesStats = {
            total: profiles.length,
            byEntity: profiles.reduce((acc, profile) => {
                const entityName = profile.entity?.referenceId || 'Non assigné';
                acc[entityName] = (acc[entityName] || 0) + 1;
                return acc;
            }, {}),
            byStatus: {
                active: profiles.filter(p => p.isActive).length,
                inactive: profiles.filter(p => !p.isActive).length
            }
        };

        return ResponseService.success(res, {
            events: { byStatus: eventsByStatus },
            indicators: indicatorsStats,
            actions: actionsStats,
            risks: riskStats,
            profiles: profilesStats
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des stats:", error);
        return ResponseService.internalServerError(res, { error: error.message });
    }
}

module.exports = {
    getStatistics
};