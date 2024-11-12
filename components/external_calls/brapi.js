const cache = require("./../db/cache");
const {admin: options} = require("./../../.config");


function refactorServerInfo(results){
    let _={
        dataTypes:[],
        methods:[],
        service:"",
        versions:[]
    }
    return results.map(result=>{
        let call={}
        call.dataTypes=Object.entries(result.datatypes)
            .filter(([datatype, value]) => value === true).map(([datatype, value]) => datatype)
        call.methods=Object.entries(result.methods)
            .filter(([method, value]) => value === true).map(([method, value]) => method)
        call.service = result.callUrl
        call.versions=Object.entries(result.versions)
            .filter(([version, value]) => value === true).map(([version, value]) => version)
        return call
    })
}

async function getServerInfoForCall(service,retries){
    retries=retries | 0
    try{
        let serverInfo=await cache.query("serverInfo.json",[{$match:{'callUrl':service}}])
        //TODO load from file of doesn't exist. Or run service
        if(serverInfo.data.length==0 && retries==0){
            return new Promise((res,rej)=>{
                fetch(`${options.protocol}://${options.hostname}:${options.port}${options.path}`, {
                    method: options.method,
                    body:JSON.stringify({})
                }).then(async (response)=>{
                    response=await response.json()
                    retries++
                    let callInfo=await getServerInfoForCall(service,retries)
                    res(callInfo)
                }).catch(err=>{
                    res({data:[],error:err,totalResults:0,found:false})
                })
            })
        }else{
            return serverInfo
        }
    }catch (e) {
        console.log(e)
        return {data:[],error:e,totalResults:0,found:false}
    }
}
function removeInternalMetaDataFromCall(response){
    for([key,value] of Object.entries(response)){
        if(key.startsWith("_")){
            delete response[key]
        }
    }
    return response
}



module.exports = {
    refactorServerInfo,
    getServerInfoForCall,
    removeInternalMetaDataFromCall
}