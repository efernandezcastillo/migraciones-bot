const { LuisRecognizer } = require("botbuilder-ai");

class LuisDialog {
  constructor(config) {
    const luisIsConfigured =
      config && config.applicationId && config.endpointKey && config.endpoint;
    if (luisIsConfigured) {
      this.recognizer = new LuisRecognizer(config, {}, true);
    }
  }

  get isConfigured() {
    return this.recognizer !== undefined;
  }

  /**
   * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
   * Aquí se envía lo ingresado por el usuario a Luis
   * @param {TurnContext} context
   */
  async executeLuisQuery(context) {
    return await this.recognizer.recognize(context);
  }

  //Llamar al entity de edad
}

module.exports.LuisDialog = LuisDialog;
