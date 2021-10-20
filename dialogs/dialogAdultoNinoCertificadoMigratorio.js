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

const CertificadoMigratorioMayorJson = require("../resources/certificadomigratoriomayor.json");
const CertificadoMigratorioMenorJson = require("../resources/certificadomigratoriomenor.json");

class DialogAdultoNinoCertificadoMigratorio extends ComponentDialog {
  constructor(userState) {
    super("dialogAdultoNinoCertificadoMigratorio");
    this.userProfile = userState.createProperty(USER_PROFILE);
    this.addDialog(new ChoicePrompt("cardPromptCertificadoMigratorio"));
    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.choiceCardStepCertificadoMigratorio.bind(this),
        this.showCardStepCertificadoMigratorio.bind(this)
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
  async choiceCardStepCertificadoMigratorio(stepContext) {
    console.log("Cartilla de Elección Certificado Migratorio");

    // Create the PromptOptions which contain the prompt and re-prompt messages.
    // PromptOptions also contains the list of choices available to the user.
    const options = {
      prompt: "Tramite de Certificado Migratorio para, ¿menores de edad o mayores de edad?",
      retryPrompt: "Debe elegir una opcion.",
      choices: this.getChoicesCertificadoMigratorio()
    };

    // Prompt the user with the configured PromptOptions.
    return await stepContext.prompt("cardPromptCertificadoMigratorio", options);
  }

  /**
   * Send a Rich Card response to the user based on their choice.
   * This method is only called when a valid prompt response is parsed from the user's response to the ChoicePrompt.
   * @param {WaterfallStepContext} stepContext
   */
  async showCardStepCertificadoMigratorio(stepContext) {
    console.log("Eleccion Certificado Migratorio");

    switch (stepContext.result.value) {
      case "Mayor Edad":
        console.log("MAYOR DE EDAD - CERTIFICADO MIGRATORIO");
        const CertificadoMigratorioMayor = CardFactory.adaptiveCard(CertificadoMigratorioMayorJson);
        await stepContext.context.sendActivity({ attachemnts: [CertificadoMigratorioMayor]});
        console.log(stepContext.context.sendActivity({ attachments: [CertificadoMigratorioMayor] }));
        break;
      case "Menor Edad":
        console.log("MENOR DE EDAD - CERTIFICADO MIGRATORIO");
        const CertificadoMigratorioMenor = CardFactory.adaptiveCard(CertificadoMigratorioMenorJson);
        await stepContext.context.sendActivity({attachemnts: [CertificadoMigratorioMenor]});
        console.log(stepContext.context.sendActivity({ attachments: [CertificadoMigratorioMenor] }));
        break;
    }

    return await stepContext.next();
  }

  getChoicesCertificadoMigratorio() {
    console.log("Eleccion getChoicesCertificadoMigratorio Cerificado Migratoria");
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

module.exports.DialogAdultoNinoCertificadoMigratorio = DialogAdultoNinoCertificadoMigratorio;
