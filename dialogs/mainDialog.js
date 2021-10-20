// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { CardFactory, MessageFactory, InputHints } = require("botbuilder");
const { LuisRecognizer } = require("botbuilder-ai");

const mdb = require("../database/mongo");
/*const PasaporteMayorJson = require("../resources/pasaportemayor.json");
const PasaporteMenorJson = require("../resources/pasaportemenor.json");
const CalidadMigratoriaMayorJson = require("../resources/calidadmigratoriamayor.json");
const CalidadMigratoriaMenorJson = require("../resources/calidadmigratoriamenor.json");
const CertificadoMigratorioMayorJson = require("../resources/certificadomigratoriomayor.json");
const CertificadoMigratorioMenorJson = require("../resources/certificadomigratoriomenor.json");*/

const {
  ComponentDialog,
  DialogSet,
  DialogTurnStatus,
  TextPrompt,
  WaterfallDialog,
  ChoicePrompt,
  ChoiceFactory,
  ConfirmPrompt
} = require("botbuilder-dialogs");

const MAIN_WATERFALL_DIALOG = "mainWaterfallDialog";
const CHOICE_PROMPT = "CHOICE_PROMPT";
const CONFIRM_PROMPT = "CONFIRM_PROMPT";
// const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
// const NAME_PROMPT = 'NAME_PROMPT';
// const NUMBER_PROMPT = 'NUMBER_PROMPT';
const USER_PROFILE = "USER_PROFILE";

class MainDialog extends ComponentDialog {
  constructor(
    luisRecognizer,
    getUsuario,
    dialogAdultoNino,
    dialogAdultoNinoCalidadMigratoria,
    dialogAdultoNinoCertificadoMigratorio,
    dialogAdultoNinoProrroga,
    evaluacionAtencion
  ) {
    super("MainDialog");

    if (!luisRecognizer)
      throw new Error("[MainDialog]: Missing parameter 'luisRecognizer' is required");
    this.luisRecognizer = luisRecognizer;

    if (!getUsuario)
      throw new Error("[MainDialog]: Missing parameter 'getUsuario' is required");

    if (!dialogAdultoNino)
      throw new Error("[MainDialog]: Missing parameter 'dialogAdultoNino' is required");

    if(!dialogAdultoNinoCalidadMigratoria)
      throw new Error("[MainDialog]: Missing parameter 'dialogAdultoNinoCalidadMigratoria' is required");

    if(!dialogAdultoNinoCertificadoMigratorio)
      throw new Error("[MainDialog]: Missing parameter 'dialogAdultoNinoCertificadoMigratorio' is required");

    if(!dialogAdultoNinoProrroga)
      throw new Error("[MainDialog]: Missing parameter 'dialogAdultoNinoProrroga' is required");

    if (!evaluacionAtencion)
      throw new Error("[MainDialog]: Missing parameter 'evaluacionAtencion' is required");

    //Definir los componentes del diálogo
    this.addDialog(new TextPrompt("TextPrompt"))
      .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
      .addDialog(new ChoicePrompt(CHOICE_PROMPT))
      .addDialog(getUsuario)
      .addDialog(dialogAdultoNino)
      .addDialog(dialogAdultoNinoCalidadMigratoria)
      .addDialog(dialogAdultoNinoCertificadoMigratorio)
      .addDialog(dialogAdultoNinoProrroga)
      .addDialog(evaluacionAtencion)
      .addDialog(
        new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
          this.registroUser.bind(this),
          this.introStep.bind(this),
          this.actStep.bind(this),
          this.finalStep.bind(this),
          this.evaluacion.bind(this)
        ])
      );

    this.initialDialogId = MAIN_WATERFALL_DIALOG;
  }

  /**
   * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
   * If no dialog is active, it will start the default dialog.
   * @param {*} turnContext
   * @param {*} accessor
   */
  async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }

  //1.- Registro Usando el Dialogo getUserInfoDialog
  async registroUser(stepContext) {
    const _data = { iduser: stepContext.context._activity.from.id };
    const BUSCAR_DATA = await mdb.GET_ONE(_data, "Formularios");
    if (BUSCAR_DATA.codRes == "00") {
      return await stepContext.next();
    } else {
      // console.log(stepContext.context._activity.from);
      const getUsuarioDetails = {};
      return await stepContext.beginDialog(
        "getUserInfoDialog",
        getUsuarioDetails
      );
    }
  }

  //1.- Conversacion Con Luis

  async introStep(stepContext) {
    if (!this.luisRecognizer.isConfigured) {
      const messageText =
        "NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.";
      await stepContext.context.sendActivity(
        messageText,
        null,
        InputHints.IgnoringInput
      );
      return await stepContext.next();
    }
    const _data = { iduser: stepContext.context._activity.from.id };
    console.log(_data);
    const BUSCAR_DATA = await mdb.GET_ONE(_data, "Formularios");
    console.log(BUSCAR_DATA);
    if (BUSCAR_DATA.codRes == "00") {
      const nombre = BUSCAR_DATA.nombre;
      const messageText = stepContext.options.restartMesg
        ? stepContext.options.restartMsg
        : `Hola ${nombre}, ¿En qué te puedo ayudar?`;
      const promptMessage = MessageFactory.text(
        messageText,
        null,
        InputHints.ExpectingInput
      );
      return await stepContext.prompt("TextPrompt", { prompt: promptMessage });
    } else {
      const messageText = stepContext.options.restartMesg
        ? stepContext.options.restartMsg
        : `¿En qué te puedo ayudar?`;
      const promptMessage = MessageFactory.text(
        messageText,
        null,
        InputHints.ExpectingInput
      );
      return await stepContext.prompt("TextPrompt", { prompt: promptMessage });
    }
  }

  //Conversacion Con Luis
  async actStep(stepContext) {
    const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
    console.log("**********************GUARDAR INFORMACION DE DIALOG *************************************");
    const _data = { iduser: stepContext.context._activity.from.id };
    const BUSCAR_DATA = await mdb.GET_ONE(_data, "Formularios");
    console.log(BUSCAR_DATA);
    const dataConversacion = {
      idUser: stepContext.context._activity.from.id,
      dni:BUSCAR_DATA.dni,
      categoria: LuisRecognizer.topIntent(luisResult),
      conversacion: stepContext.context._activity.text,
      datetime: new Date(),
    }
    const INSERT_DATA = await mdb.INSERT_ONE(dataConversacion, "Conversacion");
    console.log(INSERT_DATA, dataConversacion);
    console.log("******************** END GUARDAR INFORMACION DE DIALOG ****************************");

    switch (LuisRecognizer.topIntent(luisResult)) {
      case "CalidadMigratoria":
        console.log(stepContext.context._activity.from);
        return await stepContext.beginDialog("dialogAdultoNinoCalidadMigratoria");
      case "CertificadoMigratorio":
        console.log(stepContext.context._activity.from);
        return await stepContext.beginDialog("dialogAdultoNinoCertificadoMigratorio");
      case "Prorroga":
        console.log(stepContext.context._activity.from);
        return await stepContext.beginDialog("dialogAdultoNinoProrroga");
      case "Pasaporte":
        console.log(stepContext.context._activity.from);
        return await stepContext.beginDialog("dialogAdultoNino");
      default:
        await stepContext.context.sendActivity(`Disculpa, no entendi lo que dijiste, comencemos de nuevo!`);
        return await stepContext.replaceDialog(this.initialDialogId, {restartMsg:"Disculpa, no entendi lo que dijiste, comencemos de nuevo!"});
    }
    return await stepContext.next();
  }

  async finalStep(stepContext) {
    // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
    console.log("ENTRO AL FINAL DE LA CARTILLA");
    const _data = { iduser: stepContext.context._activity.from.id };
    const BUSCAR_DATA = await mdb.GET_ONE(_data, "Formularios");
    // console.log(BUSCAR_DATA)
    if (BUSCAR_DATA.codRes == "00") {
      const nombre = BUSCAR_DATA.nombre;
      const messageText = stepContext.options.restartMesg
        ? stepContext.options.restartMsg
        : `genial, ${nombre}. Te puedo ayudar en algo mas?`;
      const promptMessage = MessageFactory.text(
        messageText,
        null,
        InputHints.ExpectingInput
      );
      return await stepContext.prompt("TextPrompt", { prompt: promptMessage });
    }
  }

  async evaluacion(stepContext) {
    const luisResult = await this.luisRecognizer.executeLuisQuery(
      stepContext.context
    );
    console.log(luisResult);
    if (LuisRecognizer.topIntent(luisResult) == "Despedida") {
      const evaluacionAtencion = {};
      return await stepContext.beginDialog(
        "evaluacionAtencion",
        evaluacionAtencion
      );
    } else {
      return await stepContext.replaceDialog(this.initialDialogId);
    }
  }
}

module.exports.MainDialog = MainDialog;
