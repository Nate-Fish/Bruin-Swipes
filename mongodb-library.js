/** 
 * This file contains functions that act as a translation
 * library for native MongoDB Functions. Feel free
 * to add more as needed.
 * 
 * @file mongodb-library.js
 * @authors Pirjot Atwal,
 */

let MongoClient;
try {
    // Import mongodb (make sure you do npm install mongodb first)
    MongoClient = require('mongodb').MongoClient;

} catch (err) {
    console.error(err);
    console.log("Error on importing mongodb. You likely did not run 'npm install' first.");
    process.exit(0);
}

// Load .env into process
try {
    // DotENV
    require('dotenv').config(); //Load all variables in .env
} catch (err) {
    console.log("Error on importing dotenv. You likely did not run 'npm install' first.");
    process.exit(0);
}


// Build a uri, user and password settings are configured on the website
let uri = "mongodb+srv://bruinswipes:" + process.env.MONGOPASSWORD + "@bruinswipes.oe9xqoa.mongodb.net/?retryWrites=true&w=majority"; //Set this to your mongo uri
// Configure client, pass in uri and options
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: false });

/**
 * Begin connection to Mongo Database. Make sure to call closeClient at some point.
 * You can await this function so as to guarantee the client is connected before performing
 * any operations. Written as a middleware function but does not necessarily need to
 * be used as such.
 * 
 * @return {MongoClient} The connected client.
 */
async function connectClient(req, res, next=()=>{}) {
    try {
        if (!module.exports.isConnected) {
            console.log("Connecting to database...");
            module.exports.isConnected = true;
            await module.exports.client.connect();
            console.log("Connected to database!");
        } else {
            console.log("Already attempted connection, ignoring request. (Please comment this line in official versions.)");
            next();
            return false;
        }
    } catch (err) {
        console.log("An error occured while connecting: " + err.message);
    }

    next();
    return true;
}

/**
 * Terminate client connection, client object is unusable now.
 * Make sure this function is called at some point near the end of the program.
 */
async function closeClient() {
    console.log("\nTerminating connection with database...")
    return await client.close();
}

/**
 * Push a doc into the database.
 * 
 * @param {JSON} value The value/document/JSON object you want to insert
 * @param {String} database
 * @param {String} collection 
 */
async function add_data(value, database = "default", collection = "default") {
    let response = await client.db(database).collection(collection).insertOne(value);
    return response;
}


// =======================================================================================================================================
//  DEPRICATED: replaced with a version of get_data that is capable of sorting using default parameters, but functions the same otherwise
// =======================================================================================================================================
// /**
//  * Get all documents that match a query from the database collection.
//  * Note: provide an empty JSON Object if you would like to get all data.
//  * 
//  * @param {JSON} query Use an empty doc to select everything
//  * @param {String} database
//  * @param {String} collection
//  * @return {Array} An array of all documents.
//  */
// async function get_data(query = {}, database = "default", collection = "default") {
//     let response = client.db(database).collection(collection).find(query);
//     return response.toArray();
// }


/**
 * Get all documents that match a query from the database collection and sorted according to a order_by and asc
 * Note: provide an empty JSON Object if you would like to get all data.
 * 
 * @param {JSON} query Use an empty doc to select everything
 * @param {String} order_by - attribute by which to sort the resulting collection
 * @param {Boolean} asc - boolean value describing whether to sort in ascending or descending order. Default is 1, for ascending order.
 * @param {String} database
 * @param {String} collection
 * @return {Array} An array of all documents.
 */
 async function get_data(query = {}, database = "default", collection = "default", order_by = undefined, asc = 1) {
    //if order_by is given by the user, sort the collection by the attribute
    let response = undefined;
    if(order_by){
        response = client.db(database).collection(collection).find(query).sort( { order_by: asc ? 1 : -1} );
    }else{
        response = client.db(database).collection(collection).find(query);
    }
    return response.toArray();
}

/**
 * Get all documents for a provided limit from a database collection sorted in the
 * order provided.
 * @param {JSON} query 
 * @param {JSON} sort 
 * @param {String} database 
 * @param {String} collection 
 * @param {Number} skipAmount 
 * @param {Number} limit 
 * @returns An array of the documents requested
 */
async function get_data_paged(query = {}, sort={}, database = "default", collection = "default", skipAmount=50, limit=50) {
    let response = client.db(database).collection(collection).find(query).sort(sort).skip(skipAmount).limit(limit);
    return response.toArray();
}

/**
 * Delete the doc in the given collection with the matching unique _id.
 * 
 * @param {String} _id
 * @param {String} database
 * @param {String} collection
 * @returns {DeleteResult}
 */
async function delete_doc_id(_id, database = "default", collection = "default") {
    let response = await client.db(database).collection(collection).deleteOne({"_id": _id});
    return response;
}

/**
 * Delete all docs that match a given query. Look at the query rules to make a needed query.
 * NOTE: An empty query will delete all docs.
 * 
 * @param {JSON} query 
 * @param {String} database 
 * @param {String} collection 
 * @returns {DeleteResult}
 */
async function delete_docs_q(query, database = "default", collection = "default") {
    let response = await client.db(database).collection(collection).deleteMany(query);
    return response;
}

/**
 * One of the most advanced of MongoDB operations. 
 * Takes a filter and an update object to update all docs that satisfy
 * the filter with the update.
 * 
 * @param {JSON} filter For example {name: "Bob Smith"}
 * @param {JSON} update For example {$inc: num} (Increments num field in the doc)
 * @param {String} database 
 * @param {String} collection 
 * @returns {DeleteResult}
 */
 async function update_docs(filter, update, database = "default", collection = "default") {
    let response = await client.db(database).collection(collection).updateMany(filter, update);
    return response;
}

module.exports = {
    client, isConnected:false, connectClient, closeClient, add_data, get_data, delete_doc_id,
    delete_docs_q, update_docs, get_data_paged
};