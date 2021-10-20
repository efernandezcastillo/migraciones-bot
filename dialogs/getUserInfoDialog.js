const {
  ActivityPrompt,
  ComponentDialog,
  DialogSet,
  DialogTurnStatus,
  WaterfallDialog
} = require("botbuilder-dialogs");
const { CardFactory, MessageFactory } = require("botbuilder");
const getInputCLient = require("../resources/getInputCLient.json");
const mdb = require("../database/mongo");

const USER_PROFILE = "USER_PROFILE";
const CARD_PROMPT = "CARD_PROMPT";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";

class GetUserInfoDialog extends ComponentDialog {
  constructor(userState) {
    super("getUserInfoDialog");
    this.userProfile = userState.createProperty(USER_PROFILE);
    this.addDialog(new ActivityPrompt(CARD_PROMPT, this.inputValidator));
    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.showCardStep.bind(this),
        this.showUserInputStep.bind(this)
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

  async showCardStep(step) {
    let colorDocumentodni;
    let textoDocumentodni;
    let colorDocumentocorreo;
    let textoDocumentocorreo;
    console.log("showCardStep");
    const _data = { iduser: step.context._activity.from.id };
    const BUSCAR_DATA = await mdb.GET_ONE(_data, "Formularios");
    console.log(BUSCAR_DATA);
    if (BUSCAR_DATA.codRes == "00") {
      if (BUSCAR_DATA.dni == null) {
        textoDocumentodni = "Documento Incorrecto(*)";
        colorDocumentodni = "Attention";
      } else {
        textoDocumentodni = "Documento de Identidad (*)";
        colorDocumentodni = "Dark";
      }
      if (BUSCAR_DATA.correo == null) {
        textoDocumentocorreo = "Correo Electronico Incorrecto(*)";
        colorDocumentocorreo = "Attention";
      } else {
        textoDocumentocorreo = "Correo electrónico (*)";
        colorDocumentocorreo = "Dark";
      }

      const inputForm = MessageFactory.attachment(
        CardFactory.adaptiveCard({
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.0",
          body: [
            {
              type: "ColumnSet",
              columns: [
                {
                  type: "Column",
                  width: 2,
                  items: [
                    {
                      type: "Image",
                      url:
                        "https://sel.migraciones.gob.pe/servmig-valreg/Images/bann2.png",
                      horizontalAlignment: "Center",
                      size: "Stretch"
                    },
                    {
                      type: "TextBlock",
                      text:
                        "Para una mejor atención, ingrese sus datos personales.",
                      weight: "Bolder",
                      size: "Medium",
                      color: "Accent",
                      horizontalAlignment: "Left",
                      wrap: true
                    },
                    {
                      type: "TextBlock",
                      text: "Nombre Completo (*)",
                      wrap: true,
                      spacing: "Medium"
                    },
                    {
                      type: "Input.Text",
                      id: "myName",
                      placeholder: "Juan Perez Matinez",
                      value: BUSCAR_DATA.nombre
                    },
                    {
                      type: "TextBlock",
                      text: "Seleccione tipo de documento",
                      wrap: true
                    },
                    {
                      type: "Input.ChoiceSet",
                      id: "tipoDoc",
                      value: BUSCAR_DATA.tipodoc,
                      choices: [
                        {
                          title: "DNI",
                          value: "dni"
                        },
                        {
                          title: "Pasaporte",
                          value: "pasaporte"
                        },
                        {
                          title: "Cédula",
                          value: "cedula"
                        }
                      ]
                    },
                    {
                      type: "TextBlock",
                      text: textoDocumentodni,
                      wrap: true,
                      color: colorDocumentodni
                    },
                    {
                      type: "Input.Text",
                      id: "myDocument",
                      value: BUSCAR_DATA.dni,
                      placeholder: "xxxxxxxx"
                    },
                    {
                      type: "TextBlock",
                      text: "Nacionalidad (*)"
                    },
                    {
                      type: "Input.Text",
                      id: "myNationality",
                      value: BUSCAR_DATA.nacionalidad,
                      placeholder: "Peruano"
                    },
                    {
                      type: "TextBlock",
                      text: textoDocumentocorreo,
                      wrap: true,
                      color: colorDocumentocorreo
                    },
                    {
                      type: "Input.Text",
                      id: "myEmail",
                      value: BUSCAR_DATA.correo,
                      placeholder: "example@email.com",
                      style: "Email"
                    }
                  ]
                }
              ]
            },
            {
              type: "TextBlock",
              color: "Warning",
              text: "(*) Campos requeridos"
            }
          ],
          actions: [
            {
              type: "Action.Submit",
              title: "Enviar"
            }
          ]
        })
      );
      // console.log("input: ",inputForm)
      return await step.prompt(CARD_PROMPT, {
        prompt: inputForm
      });
    } else {
      const inputForm = MessageFactory.attachment(
        CardFactory.adaptiveCard(getInputCLient)
      );
      return await step.prompt(CARD_PROMPT, {
        prompt: inputForm
      });
    }
  }

  async showUserInputStep(step) {
    console.log("showUserInputStep");
    // const userInput = step.result.value;
    // await step.context.sendActivity(`Hola ${userInput.nameUser}, tu correo es: ${userInput.myEmail}, tu DNI ${userInput.myDocument} y tu nacionalidad ${userInput.myNationality}`);
    const _data = { iduser: step.context._activity.from.id };
    const BUSCAR_DATA = await mdb.GET_ONE(_data, "Formularios");
    console.log(BUSCAR_DATA);
    if (BUSCAR_DATA.codRes == "00") {
      var nombreUsuario = await step.result.value.myName;
      var tipoDoc = await step.result.value.tipoDoc;
      var dniUsuario = await step.result.value.myDocument;
      var nacionalidadUsuario = await step.result.value.myNationality;
      var correoUsuario = await step.result.value.myEmail;
      var iduser = step.context._activity.from.id;
      //VALIDACIONES
      //Validar Dni
      if (tipoDoc == "dni") {
        if (!/^([0-9])*$/.test(dniUsuario)) {
          dniUsuario = null;
        } else {
          if (dniUsuario.length != 8) {
            dniUsuario = null;
          }
        }
      }
      if (tipoDoc == "cedula") {
        if (!/^([0-9])*$/.test(dniUsuario)) {
          dniUsuario = null;
        } else {
          if (dniUsuario.length != 9) {
            dniUsuario = null;
          }
        }
      }
      if (tipoDoc == "pasaporte") {
        if (!/^([0-9])*$/.test(dniUsuario)) {
          dniUsuario = null;
        } else {
          if (dniUsuario.length != 12) {
            dniUsuario = null;
          }
        }
      }
      //Validar Email
      if (
        !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(correoUsuario)
      ) {
        correoUsuario = null;
      }
      const _query = { iduser: iduser };
      const _dataUpdate = {
        nombre: nombreUsuario,
        tipodoc: tipoDoc,
        dni: dniUsuario,
        nacionalidad: nacionalidadUsuario,
        correo: correoUsuario
      };
      if (dniUsuario == null || correoUsuario == null) {
        const UPDATE_ONE = await mdb.UPDATE_ONE(
          _query,
          _dataUpdate,
          "Formularios"
        );
        console.log(UPDATE_ONE);
        return await step.replaceDialog(this.initialDialogId);
      } else {
        const UPDATE_ONE = await mdb.UPDATE_ONE(
          _query,
          _dataUpdate,
          "Formularios"
        );
        console.log(UPDATE_ONE);
        await step.context.sendActivity(
          `Hola ${nombreUsuario} tu registro es un éxito, con numero de ${tipoDoc}: ${dniUsuario}, nacionalidad: ${nacionalidadUsuario} y correo electronico: ${correoUsuario}`
        );
        return step.next();
      }
    } else {
      var nombreUsuario = await step.result.value.myName;
      var tipoDoc = await step.result.value.tipoDoc;
      var dniUsuario = await step.result.value.myDocument;
      var nacionalidadUsuario = await step.result.value.myNationality;
      var correoUsuario = await step.result.value.myEmail;
      var iduser = step.context._activity.from.id;

      //Validar Dni
      if (tipoDoc == "dni") {
        if (!/^([0-9])*$/.test(dniUsuario)) {
          dniUsuario = null;
        } else {
          if (dniUsuario.length != 8) {
            dniUsuario = null;
          }
        }
      }
      if (tipoDoc == "cedula") {
        if (!/^([0-9])*$/.test(dniUsuario)) {
          dniUsuario = null;
        } else {
          if (dniUsuario.length != 9) {
            dniUsuario = null;
          }
        }
      }
      if (tipoDoc == "pasaporte") {
        if (!/^([0-9])*$/.test(dniUsuario)) {
          dniUsuario = null;
        } else {
          if (dniUsuario.length != 12) {
            dniUsuario = null;
          }
        }
      }
      //Validar Email
      if (
        !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(correoUsuario)
      ) {
        correoUsuario = null;
      }
      const _data = {
        iduser: iduser,
        nombre: nombreUsuario,
        tipodoc: tipoDoc,
        dni: dniUsuario,
        nacionalidad: nacionalidadUsuario,
        correo: correoUsuario
      };
      console.log(_data);
      if (dniUsuario == null || correoUsuario == null) {
        const INSERT_DATA = await mdb.INSERT_ONE(_data, "Formularios");
        console.log(INSERT_DATA);
        return await step.replaceDialog(this.initialDialogId);
      } else {
        const INSERT_DATA = await mdb.INSERT_ONE(_data, "Formularios");
        console.log(INSERT_DATA);
        await step.context.sendActivity(
          `Hola ${nombreUsuario} tu registro es un éxito, con numero de ${tipoDoc}: ${dniUsuario}, nacionalidad: ${nacionalidadUsuario} y correo electronico: ${correoUsuario}`
        );
        return await step.next();
      }
    }
  }

  // If you remove this validation logic, it will cause an error cause this is mandatory for ActivityPrompt
  async inputValidator(promptContext) {
    console.log("inputValidator");
    const userInputObject = promptContext.recognized.value.value;
    if (userInputObject == null) {
      return false;
    } else {
      if (
        userInputObject.myName == "" ||
        userInputObject.tipoDoc == "" ||
        userInputObject.myDocument == "" ||
        userInputObject.myNationality == "" ||
        userInputObject.myEmail == ""
      ) {
        await promptContext.context.sendActivity(
          `Hola ${userInputObject.myName} tus datos son incompletos, por favor llenar completamente el formulario`
        );
        console.log("Datos Incompletos");
        console.log(userInputObject);
        return false;
      } else {
        // await promptContext.context.sendActivity(`Hola ${userInputObject.myName}`);
        // console.log(userInputObject);
        return true;
      }
      // You can add some validation logic for email address and phone number
      // userInputObject.myEmail, userInputObject.myTel
    }
  }
}

module.exports.GetUserInfoDialog = GetUserInfoDialog;
