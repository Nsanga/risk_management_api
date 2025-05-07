const Historique = require("../models/historyKRI.model");

async function createHistoryKRI(req, res) {
  try {
    const historique = new Historique(req.body);
    await historique.save();
    res.status(201).json({
      statut: 201,
      message: "Historique KRI créé avec succès",
      data: historique,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la création du test: " + error.message });
  }
}

async function getAllHistoriqueKri(req, res) {
  try {
    const allHistorique = await Historique.find();
    res.status(200).json({
      statut: 200,
      message: "Action reucpérée avec succès",
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
    const historique = await Historique.find({
      idKeyIndicator: req.body.idKeyIndicator,
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
      message: "Historique liée au KRI (5 derniers éléments)",

      data: {
        Average: average,
        histories: historique,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération de l'historique: " + error.message,
    });
  }
}

module.exports = {
  createHistoryKRI,
  getAllHistoriqueKri,
  getAllHistoriqueByIdKeyIndicator,
};
