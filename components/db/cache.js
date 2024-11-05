const DB = require("./mongo")

const CACHE_DAYS=1

async function query(callName,requestParam) {
    if(requestParam){
        if(!requestParam instanceof Array){
            throw new Error("Invalid requestParam object. Must be array ")
        }
    }
    let now=Date.now()
    let db=await new DB();
    let collection=db.client.collection(callName)

    //TODO query options
    let callStructure=await collection.aggregate(requestParam).toArray()
    if(callStructure.length>0) {
        if (callStructure[0]._createdAt + CACHE_DAYS * 24 * 60 * 60 * 1000 > now) { //if cache is older than CACHE_DAYS
            callStructure = callStructure.map(result => {
                delete result._createdAt
                delete result._id
                return result
            })
        } else {
            //cache duration elapsed
            let deleteResult = await clear(callName)
            callStructure = []
        }
    }
    //TODO lookup in cache for call
    //TODO if params filter call
    //TODO return {data:null, found:false, error:""}
    await db.disconnect()
    return {data:callStructure, found:callStructure.length>0, error:"",totalResults:await count(callName)}
}

async function define(callName,results) {
    const now=Date.now()
    let db=await new DB();
    let collection=db.client.collection(callName)
    results=results.map(result=>{
        result._createdAt=now
        return result
    })
    //TODO this should be is all of them
    let insertResult=await collection.insertMany(results)

    //TODO date
    //inserResult{ acknowledged:true/false, insertedIds:[], insertedCount:X}
    //insertResult.insertedIds[0].toString()

    await db.disconnect()
    return insertResult
}
async function retrieve(callName,moduleName,getCallStructure) {
    let db=await new DB();
    let collection=db.client.collection(callName+".structure")
    let callStructure= await collection.findOne({})
    if(callStructure == null){
        callStructure=getCallStructure(moduleName,callName)
        await store(callName,callStructure)
    }
    await db.disconnect()
    return callStructure
}
async function store(callName,callStructure){
    let db=await new DB();
    let collection=db.client.collection(callName+".structure")
    let insertResult= await collection.insertOne(callStructure)
    await db.disconnect()
    return insertResult
}
async function count(callName){
    let db=await new DB();
    let collection=db.client.collection(callName)
    let count=await collection.count()
    await db.disconnect()
    return count
}
async function age(callName){
    let db=await new DB();
    let collection=db.client.collection(callName)
    let age=await collection.findOne({})
    if(age) age=age._createdAt || Date.now()+1000*60*60
    else age=Date.now()+1000*60*60
    await db.disconnect()
    return age
}

async function clear(callName){
    let db=await new DB();
    let collection=db.client.collection(callName)
    let age=await collection.deleteMany({})
    await db.disconnect()
    return age
}

module.exports = {
    query,
    define,
    callStructure:{retrieve,store},
    count,
    age,
    clear
}