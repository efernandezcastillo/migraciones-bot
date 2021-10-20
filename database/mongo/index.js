const mongoClient = require("mongodb").MongoClient;
//FUNCION DE ACTUALIZAR JSON
exports.UPDATE_ONE = async (query, data, name_collection) => {
  try {
    console.log("MongoDb", query);

    const client = await mongoClient.connect(process.env.URL_MDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const db = client.db(process.env.MDB_NAME);
    const collection = db.collection(name_collection);
    console.log("data", data);
    const { result } = await collection.updateOne(query, {
      $set: {
        ...data,
        _updated: new Date()
      }
    });

    console.log("success", result);
    return result;
  } catch (error) {
    console.log("error");
    console.log(error);
  }
};

exports.INSERT_ONE = async (data, name_collection) => {
  try {
    const client = await mongoClient.connect(process.env.URL_MDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const db = client.db(process.env.MDB_NAME);
    const collection = db.collection(name_collection);
    const { result } = await collection.insertOne({
      ...data,
      _insert: new Date()
    });

    return result;
  } catch (error) {
    console.log("her");
    console.log(error);
  }
};

exports.GET_ONE = async (query, name_collection) => {
  try {
    const client = await mongoClient.connect(process.env.URL_MDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const db = client.db(process.env.MDB_NAME);
    const collection = db.collection(name_collection);
    const result = await collection.findOne(query);

    /* console.log("success-MDB"); */

    return { codRes: result ? "00" : "01", ...result };
  } catch (error) {
    console.log("error");
    console.log(error);
  }
};
