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
    const { entityName } = req.body; // Le nom de l'entité vient du corps de la requête

    if (!entityName) {
        return res.status(400).json({
            success: false,
            message: "Le nom de l'entité est requis dans le corps de la requête."
        });
    }

    const excelService = new ExcelService();

    try {
        // Appel à la méthode pour récupérer les risques et contrôles de l'entité
        const entityRiskControls = await excelService.getEntityRiskControlsByEntityName(entityName);

        if (!entityRiskControls || entityRiskControls.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Aucune donnée trouvée pour l'entité : ${entityName}`
            });
        }

        res.status(200).json({
            success: true,
            data: entityRiskControls
        });
    } catch (error) {
        console.error(`Erreur lors de la récupération des données pour l'entité '${entityName}':`, error.message);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des données",
            error: error.message
        });
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

exports.copyRiskOrControls = async (req, res) => {
    const { itemIds, targetEntityId, itemType } = req.body;
    const excelService = new ExcelService();
  
    try {
      if (!itemIds || !Array.isArray(itemIds) || !targetEntityId || !itemType) {
        return res.status(400).json({
          success: false,
          message: "Les paramètres itemIds (tableau), targetEntityId et itemType sont requis.",
        });
      }
  
      // Vérifie que le type est valide
      if (!['risk', 'control'].includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: "Le type spécifié doit être 'risk' ou 'control'.",
        });
      }
  
      // Appelle le service pour copier les risques/contrôles
      const copiedItems = await excelService.copyRiskOrControls(itemIds, targetEntityId, itemType);
  
      if (!copiedItems.success) {
        return res.status(400).json({
          success: false,
          message: copiedItems.message,
          data: copiedItems.data,
        });
      }
  
      // Retourne la réponse avec succès et les éléments copiés
      return res.status(200).json({
        success: true,
        message: `${itemType === 'risk' ? 'Risques' : 'Contrôles'} copiés avec succès.`,
        data: copiedItems.data,
      });
    } catch (error) {
      console.error("Erreur lors de la copie :", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la copie des éléments.",
        error: error.message,
      });
    }
  };
  
  exports.moveRiskOrControls = async (req, res) => {
    const { itemIds, targetEntityId, itemType } = req.body;
    const excelService = new ExcelService();
  
    try {
      // Validation des paramètres
      if (!itemIds || !Array.isArray(itemIds) || !targetEntityId || !itemType) {
        return res.status(400).json({
          success: false,
          message: "Les paramètres itemIds (tableau), targetEntityId et itemType sont requis.",
        });
      }
  
      // Vérifie que le type est valide
      if (!['risk', 'control'].includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: "Le type spécifié doit être 'risk' ou 'control'.",
        });
      }
  
      // Appelle le service pour déplacer les risques/contrôles
      const movedItems = await excelService.moveRiskOrControls(itemIds, targetEntityId, itemType);
  
      // Si l'opération échoue (aucun élément déplacé)
      if (!movedItems.success) {
        return res.status(400).json({
          success: false,
          message: movedItems.message,
          data: movedItems.data,
        });
      }
  
      // Retourne la réponse avec succès et les éléments déplacés
      return res.status(200).json({
        success: true,
        message: `${itemType === 'risk' ? 'Risques' : 'Contrôles'} déplacés avec succès.`,
        data: movedItems.data,
      });
    } catch (error) {
      console.error("Erreur lors du déplacement :", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du déplacement des éléments.",
        error: error.message,
      });
    }
  };
  