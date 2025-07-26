const History = require("../models/history.model");
const EntityRiskControl = require("../models/entityRiskControl.model");

const calculateRemindOnDate = (frequency, lastOperationDate) => {
  const [day, month, year] = lastOperationDate.split("/");
  const formattedDate = `${year}-${month}-${day}`;

  if (!formattedDate || isNaN(new Date(formattedDate).getTime())) {
    console.error("Invalid lastOperationDate:", formattedDate);
    return null;
  }

  const lastOperation = new Date(formattedDate);
  let nextDate;

  if (frequency === "Daily") {
    nextDate = new Date(lastOperation.setDate(lastOperation.getDate() + 1));
  } else if (frequency === "Weekly") {
    nextDate = new Date(lastOperation.setDate(lastOperation.getDate() + 7));
  } else if (frequency === "Monthly") {
    nextDate = new Date(lastOperation.setMonth(lastOperation.getMonth() + 1));
  } else if (frequency === "Quarterly") {
    nextDate = new Date(lastOperation.setMonth(lastOperation.getMonth() + 3));
  } else if (frequency === "Semi-Annually") {
    nextDate = new Date(lastOperation.setMonth(lastOperation.getMonth() + 6));
  } else if (frequency === "Annually") {
    nextDate = new Date(
      lastOperation.setFullYear(lastOperation.getFullYear() + 1)
    );
  }

  return nextDate?.toISOString()?.split("T")[0]; // Format YYYY-MM-DD
};

const generateReference = async () => {
  try {
    const lastHistory = await History.findOne().sort({ createdAt: -1 });
    let newReference = "001";

    if (lastHistory && lastHistory.reference) {
      const lastReference = parseInt(lastHistory.reference, 10);
      newReference = String(lastReference + 1).padStart(3, "0");
    }

    return newReference;
  } catch (error) {
    throw new Error(
      "Erreur lors de la génération de la référence: " + error.message
    );
  }
};

const createHistory = async (data) => {
  const tenantId = req.tenantId;
  const allRiskControl = await EntityRiskControl.find({tenantId});

  const entityWithControl = allRiskControl.find((entity) =>
    entity.controls.some((control) => control._id.toString() === data.idControl)
  );

  if (!entityWithControl) {
    throw new Error("Entité contenant le contrôle non trouvée !");
  }

  const controlIndex = entityWithControl.controls.findIndex(
    (control) => control._id.toString() === data.idControl
  );

  if (controlIndex === -1) {
    throw new Error("Contrôle non trouvé !");
  }

  entityWithControl.controls[controlIndex].nextAssessMent =
    calculateRemindOnDate(data.frequency, data.assessedOn);

  entityWithControl.markModified("controls");

  await entityWithControl.save();

  try {
    // Étape 1 : Récupérer les historiques liés à ce contrôle
    const existingHistories = await History.find({
      idControl: data.idControl,
      tenantId
    });

    // Étape 2 : Calculer le coutAnnually
    const historyLength = existingHistories.length;
    const coutAnnually = `Q${
      historyLength === 4 ? historyLength : historyLength + 1
    }`;

    // Étape 3 : Générer une référence et créer le nouvel historique
    const reference = await generateReference();
    const newHistory = new History({
      ...data,
      reference,
      coutAnnually,
    });

    return await newHistory.save();
  } catch (error) {
    throw new Error("Erreur lors de la création du test: " + error.message);
  }
};

const getAllHistory = async () => {
  try {
    const tenantId = req.tenantId;
    return await History.find({tenantId});
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération de l'historique: " + error.message
    );
  }
};

const updateHistory = async (id, data) => {
  const tenantId = req.tenantId;
  const allRiskControl = await EntityRiskControl.find({tenantId});

  const entityWithControl = allRiskControl.find((entity) =>
    entity.controls.some((control) => control._id.toString() === data.idControl)
  );

  if (!entityWithControl) {
    throw new Error("Entité contenant le contrôle non trouvée !");
  }

  const controlIndex = entityWithControl.controls.findIndex(
    (control) => control._id.toString() === data.idControl
  );

  if (controlIndex === -1) {
    throw new Error("Contrôle non trouvé !");
  }

  entityWithControl.controls[controlIndex].nextAssessMent =
    calculateRemindOnDate(data.frequency, data.assessedOn);

  entityWithControl.markModified("controls");
  await entityWithControl.save();

  try {
    // Met à jour l’historique existant
    const updatedHistory = await History.findByIdAndUpdate(
      id,
      tenantId,
      { $set: data },
      { new: true }
    );

    if (!updatedHistory) {
      throw new Error("Historique introuvable !");
    }

    return updatedHistory;
  } catch (error) {
    throw new Error("Erreur lors de la mise à jour du test: " + error.message);
  }
};

module.exports = {
  createHistory,
  getAllHistory,
  updateHistory,
};