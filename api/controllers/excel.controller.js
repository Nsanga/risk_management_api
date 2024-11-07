const fs = require('fs');
const ExcelService = require('../services/excel.service'); // Assurez-vous que ce chemin est correct

// Contrôleur pour uploader et sauvegarder un fichier Excel
exports.extractDataFromExcel = (req, res) => {
    const file = req.file; // Obtenir le fichier téléchargé

    if (!file) {
        return res.status(400).json({
            success: false,
            message: "Aucun fichier n'a été téléchargé."
        });
    }

    const excelService = new ExcelService(file); // Passer le fichier ici
    const data = excelService.readExcelFile();

    if (data) {
        return res.status(200).json({
            success: true,
            message: "Données extraites avec succès.",
            data
        });
    } else {
        return res.status(500).json({
            success: false,
            message: "Erreur lors de l'extraction des données."
        });
    }
};

exports.getEntityRiskControlsByEntityName = async (req, res) => {
    const { entityName } = req.body;
    const excelService = new ExcelService();

    try {
        // Appelle le service pour récupérer les données
        const entityRiskControl = await excelService.getEntityRiskControlsByEntityName(entityName);

        if (!entityRiskControl) {
            return res.status(404).json({ success: false, message: "Aucune donnée trouvée pour cette entité." });
        }

        res.status(200).json({ success: true, data: entityRiskControl });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur lors de la récupération des données", error: error.message });
    }
};
 
// Contrôleur pour récupérer les risques et contrôles d’une entité par ID 
exports.getEntityRiskControlById = async (req, res) => {
    const { entityRefId } = req.params;
    const excelService = new ExcelService();

    try {
        // Appelle le service pour récupérer les données
        const entityRiskControl = await excelService.getEntityRiskControlById(entityRefId);

        if (!entityRiskControl) {
            return res.status(404).json({ success: false, message: "Aucune donnée trouvée pour cette entité." });
        }

        res.status(200).json({ success: true, data: entityRiskControl });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur lors de la récupération des données", error: error.message });
    }
};

// Contrôleur pour copier un risque ou un contrôle vers une autre entité
exports.copyRiskOrControl = async (req, res) => {
    const { entityRefId, referenceNumber, type } = req.params;
    const excelService = new ExcelService();

    try {
        // Appelle le service pour copier le risque/contrôle
        const copiedItem = await excelService.copyRiskOrControl(entityRefId, referenceNumber, type);

        res.status(200).json({ success: true, data: copiedItem });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur lors de la copie de l'élément", error: error.message });
    }
};

// Contrôleur pour déplacer un risque ou un contrôle vers une autre entité
exports.moveRiskOrControl = async (req, res) => {
    const { entityRefId, referenceNumber, type } = req.params;
    const excelService = new ExcelService();

    try {
        // Appelle le service pour déplacer le risque/contrôle
        const movedItem = await excelService.moveRiskOrControl(entityRefId, referenceNumber, type);

        res.status(200).json({ success: true, data: movedItem });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur lors du déplacement de l'élément", error: error.message });
    }
};

