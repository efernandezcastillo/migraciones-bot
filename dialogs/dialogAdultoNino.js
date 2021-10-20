const { AttachmentLayoutTypes, CardFactory } = require("botbuilder");
const {
  ChoicePrompt,
  ComponentDialog,
  DialogSet,
  DialogTurnStatus,
  WaterfallDialog
} = require("botbuilder-dialogs");

const USER_PROFILE = "USER_PROFILE";
const CARD_PROMPT = "CARD_PROMPT";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";

const mdb = require("../database/mongo");

const PasaporteMayorJson = require("../resources/pasaportemayor.json");
const PasaporteMenor = require("../resources/pasaportemenor.json");

class DialogAdultoNino extends ComponentDialog {
  constructor(userState) {
    super("dialogAdultoNino");
    this.userProfile = userState.createProperty(USER_PROFILE);
    this.addDialog(new ChoicePrompt("cardPrompt"));
    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.choiceCardStep.bind(this),
        this.showCardStep.bind(this)
      ])
    );

    this.initialDialogId = WATERFALL_DIALOG;
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

  /**
   * 1. Prompts the user if the user is not in the middle of a dialog.
   * 2. Re-prompts the user when an invalid input is received.
   *
   * @param {WaterfallStepContext} stepContext
   */
  async choiceCardStep(stepContext) {
    console.log("Cartilla de Elección");

    // Create the PromptOptions which contain the prompt and re-prompt messages.
    // PromptOptions also contains the list of choices available to the user.
    const options = {
      prompt: "Tramite de pasaporte para, ¿menores de edad o mayores de edad?",
      retryPrompt: "Debe elegir una opcion",
      choices: this.getChoices()
    };

    // Prompt the user with the configured PromptOptions.
    return await stepContext.prompt("cardPrompt", options);
  }

  /**
   * Send a Rich Card response to the user based on their choice.
   * This method is only called when a valid prompt response is parsed from the user's response to the ChoicePrompt.
   * @param {WaterfallStepContext} stepContext
   */
  async showCardStep(stepContext) {

    /*console.log("********************** Actualizar informacion guardada de pasaporte *************************************");
    const _data = { iduser: stepContext.context._activity.from.id };
    const BUSCAR_DATA = await mdb.GET_ONE(_data, "Conversacion");
    const dataConversacion = {
      idUser: stepContext.context._activity.from.id,
      dni:BUSCAR_DATA.dni,
      categoria: 'Pasaporte',
      conversacion: stepContext.result.value,
      datetime: new Date()
    }
    console.log(BUSCAR_DATA);
    console.log("********************** end Actualizar informacion guardada de pasaporte *************************************"); 
    */
    switch (stepContext.result.value) {
      case "Mayor Edad":
        console.log("MAYOR DE EDAD - PASAPORTE");
        const pasaporteMayor = CardFactory.adaptiveCard(PasaporteMayorJson);
        await stepContext.context.sendActivity({attachemnts: [pasaporteMayor]});
        console.log(stepContext.context.sendActivity({ attachments: [pasaporteMayor] }));
        break;
      case "Menor Edad":
        console.log("MENOR DE EDAD  - PASAPORTE");
        const pasaporteMenor = CardFactory.adaptiveCard(PasaporteMenor);
        await stepContext.context.sendActivity({attachemnts: [pasaporteMenor]});
        console.log(stepContext.context.sendActivity({ attachments: [pasaporteMenor] }));
        break;
    }
    return await stepContext.next();
  }

  getChoices() {
    const cardOptions = [
      {
        value: "Mayor Edad",
        synonyms: ["MayorEdad"]
      },
      {
        value: "Menor Edad",
        synonyms: ["MenorEdad"]
      }
    ];

    return cardOptions;
  }
}

module.exports.DialogAdultoNino = DialogAdultoNino;
