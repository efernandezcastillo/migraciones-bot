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

const ProrrogaMayorJson = require("../resources/prorrogamayor.json");
const ProrrogaMenorJson = require("../resources/prorrogamenor.json");

class DialogAdultoNinoProrroga extends ComponentDialog {
  constructor(userState) {
    super("dialogAdultoNinoProrroga");
    this.userProfile = userState.createProperty(USER_PROFILE);
    this.addDialog(new ChoicePrompt("cardPromptProrroga"));
    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.choiceCardStepProrroga.bind(this),
        this.showCardStepProrroga.bind(this)
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
  async choiceCardStepProrroga(stepContext) {
    console.log("Cartilla de Elección Prorroga Migratorio");

    // Create the PromptOptions which contain the prompt and re-prompt messages.
    // PromptOptions also contains the list of choices available to the user.
    const options = {
      prompt: "Tramite de Prorroga Migratorio para, ¿menores de edad o mayores de edad?",
      retryPrompt: "Debe elegir una opcion.",
      choices: this.getChoicesProrroga()
    };

    // Prompt the user with the configured PromptOptions.
    return await stepContext.prompt("cardPromptProrroga", options);
  }

  /**
   * Send a Rich Card response to the user based on their choice.
   * This method is only called when a valid prompt response is parsed from the user's response to the ChoicePrompt.
   * @param {WaterfallStepContext} stepContext
   */
  async showCardStepProrroga(stepContext) {
    console.log("Eleccion Prorroga Migratorio");

    switch (stepContext.result.value) {
      case "Mayor Edad":
        console.log("MAYOR DE EDAD - PRORROGA MIGRATORIO");
        const ProrrogaMayor = CardFactory.adaptiveCard(ProrrogaMayorJson);
        await stepContext.context.sendActivity({ attachemnts: [ProrrogaMayor]});
        console.log(stepContext.context.sendActivity({ attachments: [ProrrogaMayor] }));
        break;
      case "Menor Edad":
        console.log("MENOR DE EDAD - PRORROGA MIGRATORIO");
        const ProrrogaMenor = CardFactory.adaptiveCard(ProrrogaMenorJson);
        await stepContext.context.sendActivity({attachemnts: [ProrrogaMenor]});
        console.log(stepContext.context.sendActivity({ attachments: [ProrrogaMenor] }));
        break;
    }

    return await stepContext.next();
  }

  getChoicesProrroga() {
    console.log("Eleccion getChoicesProrroga Prorroga Migratoria");
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

module.exports.DialogAdultoNinoProrroga = DialogAdultoNinoProrroga;
