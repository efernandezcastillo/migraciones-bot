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

const CalidadMigratoriaMayorJson = require("../resources/calidadmigratoriamayor.json");
const CalidadMigratoriaMenorJson = require("../resources/calidadmigratoriamenor.json");

class DialogAdultoNinoCalidadMigratoria extends ComponentDialog {
  constructor(userState) {
    super("dialogAdultoNinoCalidadMigratoria");
    this.userProfile = userState.createProperty(USER_PROFILE);
    this.addDialog(new ChoicePrompt("cardPromptCalidadMigratoria"));
    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.choiceCardStepCalidadMigratoria.bind(this),
        this.showCardStepCalidadMigratoria.bind(this)
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
  async choiceCardStepCalidadMigratoria(stepContext) {
    //console.log("Cartilla de Elección Caiadad Migratoria");

    // Create the PromptOptions which contain the prompt and re-prompt messages.
    // PromptOptions also contains the list of choices available to the user.
    const options = {
      prompt: "Tramite de Calidad Migratoria para, ¿menores de edad o mayores de edad?",
      retryPrompt: "Debe elegir una opcion.",
      choices: this.getChoicesCalidadMigratoria()
    };

    // Prompt the user with the configured PromptOptions.
    return await stepContext.prompt("cardPromptCalidadMigratoria", options);
  }

  /**
   * Send a Rich Card response to the user based on their choice.
   * This method is only called when a valid prompt response is parsed from the user's response to the ChoicePrompt.
   * @param {WaterfallStepContext} stepContext
   */
  async showCardStepCalidadMigratoria(stepContext) {
    //console.log("Eleccion Caiadad Migratoria");

    switch (stepContext.result.value) {
      case "Mayor Edad":
        console.log("MAYOR DE EDAD - CALIDAD MIGRATORIA");
        const CalidadMigratoriaMayor = CardFactory.adaptiveCard(CalidadMigratoriaMayorJson);
        await stepContext.context.sendActivity({attachemnts: [CalidadMigratoriaMayor] });
        console.log(stepContext.context.sendActivity({ attachments: [CalidadMigratoriaMayor] }));
        break;
      case "Menor Edad":
        console.log("MENOR DE EDAD - CALIDAD MIGRATORIA");
        const CalidadMigratoriaMenor = CardFactory.adaptiveCard(CalidadMigratoriaMenorJson);
        await stepContext.context.sendActivity({attachemnts: [CalidadMigratoriaMenor]});
        console.log(stepContext.context.sendActivity({ attachments: [CalidadMigratoriaMenor] }));
        break;
    }

    return await stepContext.next();
  }

  getChoicesCalidadMigratoria() {
    //console.log("Eleccion getChoicesCalidadMigratoria Caiadad Migratoria");
    return [
      {
        value: "Mayor Edad",
        synonyms: ["MayorEdad"]
      },
      {
        value: "Menor Edad",
        synonyms: ["MenorEdad"]
      }
    ];
    //return cardOptions;
  }
}

module.exports.DialogAdultoNinoCalidadMigratoria = DialogAdultoNinoCalidadMigratoria;
