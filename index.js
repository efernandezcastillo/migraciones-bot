// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
//test

const dotenv = require("dotenv");
const path = require("path");
const restify = require("restify");

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const {BotFrameworkAdapter, ConversationState, MemoryStorage, UserState} = require("botbuilder");

// This bot's main dialog.
const { WelcomeBot } = require("./bots/welcomeBot");
const { MainDialog } = require("./dialogs/mainDialog");
const { LuisDialog } = require("./dialogs/luisDialog");

const { GetUserInfoDialog } = require("./dialogs/getUserInfoDialog");
const { DialogAdultoNino } = require("./dialogs/dialogAdultoNino");
const { DialogAdultoNinoCalidadMigratoria } = require("./dialogs/dialogAdultoNinoCalidadMigratoria");
const { DialogAdultoNinoCertificadoMigratorio } = require("./dialogs/dialogAdultoNinoCertificadoMigratorio");
const { DialogAdultoNinoProrroga } = require("./dialogs/dialogAdultoNinoProrroga");
const { EvaluacionAtencion } = require("./dialogs/evaluacionAtencion");

// Import required bot configuration.
const ENV_FILE = path.join(__dirname, ".env");
dotenv.config({ path: ENV_FILE });

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
});

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3982, () => {
  console.log(`\n${server.name} listening to ${server.url}`);
  console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
  console.log(`\nTo talk to your bot, open the emulator select "Open Bot"`);
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  console.error(`\n [onTurnError]: ${error}`);
  // Send a message to the user
  await context.sendActivity(`Oops. Something went wrong!`);
};

// If configured, pass in the FlightBookingRecognizer.  (Defining it externally allows it to be mocked for tests)
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = {
  applicationId: LuisAppId,
  endpointKey: LuisAPIKey,
  endpoint: `https://${LuisAPIHostName}`
};

const luisRecognizer = new LuisDialog(luisConfig);

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// CONVERSACIÓN CON LUIS
const getUsuario = new GetUserInfoDialog(userState);
const dialogAdultoNino = new DialogAdultoNino(userState);
const dialogAdultoNinoCalidadMigratoria = new DialogAdultoNinoCalidadMigratoria(userState);
const dialogAdultoNinoCertificadoMigratorio = new DialogAdultoNinoCertificadoMigratorio(userState);
const dialogAdultoNinoProrroga = new DialogAdultoNinoProrroga(userState);
const evaluacionAtencion = new EvaluacionAtencion(userState);
const dialog = new MainDialog(
  luisRecognizer,
  getUsuario,
  dialogAdultoNino,
  dialogAdultoNinoCalidadMigratoria,
  dialogAdultoNinoCertificadoMigratorio,
  dialogAdultoNinoProrroga,
  evaluacionAtencion
);
const bot = new WelcomeBot(conversationState, userState, dialog);

// Listen for incoming requests.
server.post("/api/messages", (req, res) => {
  adapter.processActivity(req, res, async context => {
    // Route to main dialog.
    /*console.log("/////////////// REQUEST //////////////////////");
    if(typeof req.body.text !== 'undefined')
      console.log(req.body.text);
    console.log("/////////////// END REQUEST //////////////////////");*/
    await bot.run(context);
  });
});
