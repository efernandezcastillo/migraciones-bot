const mdb = require("../database/mongo");
const { InputHints } = require("botbuilder");
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

class EvaluacionAtencion extends ComponentDialog {
  constructor(userState) {
    super("evaluacionAtencion");
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
    console.log("Cartilla de Elección de evaluacion");

    // Create the PromptOptions which contain the prompt and re-prompt messages.
    // PromptOptions also contains the list of choices available to the user.
    const options = {
      prompt:
        "Queremos mejorar la calidad de nuestros servicios, por favor evalue nuestra atención automatizada",
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
    let eleccion;
    const _data = { iduser: stepContext.context._activity.from.id };
    const BUSCAR_DATA = await mdb.GET_ONE(_data, "Formularios");
    const nombres = BUSCAR_DATA.nombre;
    console.log(nombres);
    switch (stepContext.result.value) {
      case "(1) Muy bueno":
        stepContext.context.sendActivity(
          `Muchas gracias por calificarnos ${nombres}. Hasta pronto`
        );
        eleccion = 1;
        break;
      case "(2) Bueno":
        stepContext.context.sendActivity(
          `Muchas gracias por calificarnos ${nombres}. Hasta pronto`
        );
        eleccion = 2;
        break;
      case "(3) Regular":
        stepContext.context.sendActivity(
          `Muchas gracias por calificarnos ${nombres}. Hasta pronto`
        );
        eleccion = 3;
        break;
      case "(4) Malo":
        stepContext.context.sendActivity(
          `Muchas gracias por calificarnos ${nombres}. Hasta pronto`
        );
        eleccion = 4;
        break;
      case "(5) Muy malo":
        stepContext.context.sendActivity(
          `Muchas gracias por calificarnos ${nombres}. Hasta pronto`
        );
        eleccion = 5;
        break;
    }
    console.log(eleccion);
    const _dataInsert = {
      iduser: stepContext.context._activity.from.id,
      DNI: BUSCAR_DATA.dni,
      rating: eleccion
    };
    console.log(_dataInsert);
    const INSERT_DATA = await mdb.INSERT_ONE(_dataInsert, "Evaluacion");
    console.log(INSERT_DATA);
    const cancelMessageText = "Cerrando BotMigraciones...";
    await stepContext.context.sendActivity(
      cancelMessageText,
      null,
      InputHints.IgnoringInput
    );
    return stepContext.cancelAllDialogs();
  }

  getChoices() {
    const cardOptions = [
      {
        value: "(1) Muy bueno",
        synonyms: ["Muy bueno"]
      },
      {
        value: "(2) Bueno",
        synonyms: ["Bueno"]
      },
      {
        value: "(3) Regular",
        synonyms: ["Regular"]
      },
      {
        value: "(4) Malo",
        synonyms: ["Malo"]
      },
      {
        value: "(5) Muy malo",
        synonyms: ["Muy malo"]
      }
    ];

    return cardOptions;
  }
}

module.exports.EvaluacionAtencion = EvaluacionAtencion;
