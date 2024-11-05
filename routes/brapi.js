const express = require('express');
const router = express.Router();
const cache = require("./../components/db/cache")
const options = require("./../.config").admin

//TODO refactor and send to module
function refactor(results){
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

//TODO refactor and send to module
async function getServerInfoForCall(service){
    try{
        let serverInfo=await cache.query("serverInfo.json",[{$match:{'callUrl':service}}])
        //TODO load from file of doesn't exist. Or run service
        if(serverInfo.data.length==0){
            return new Promise((res,rej)=>{
                fetch(`${options.protocol}://${options.hostname}:${options.port}${options.path}`, {
                    method: options.method,
                    body:JSON.stringify({})
                }).then(async (response)=>{
                    response=await response.json()
                    //TODO rerun function
                    let callInfo=await getServerInfoForCall(service)
                    res(callInfo)
                }).catch(err=>{
                    return {data:[],error:err,totalResults:0,found:false}
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


//-------------------------------------------------

router.get('/', async function(req, res, next) {
    let results = await cache.query("serverInfo.json",[])

    //TODO get call Structure
    res.send(refactor(results.data))
});


router.get('/:version/:service/',async function(req,res,next){
    try{
        // TODO how do I deal with composed services (a/b), new get
        // Set up a new call for post
        let {version,service}=req.params
        let callInfo=await getServerInfoForCall(service)
        ///TODO how to get the module
        /*let requestParams=sanitizeParams(req.query) //TODO security check params based onl

        //TODO get BrAPI query. Maybe request from other module.
        let servers= {
            server: `${req.protocol}://${req.headers.host}/`,
            //TODO not in config
            //*****************
            // ****************

            activeGraph: require("./../.config.json").sparql.ontoBrAPIgraph
        }

        let callStructure=await brapiAttributesQuery(servers, version, moduleName, callName, requestParams)
        //res.json(callStructure)*/
        res.json(callInfo)
    }catch(err){
        res.json(err)
    }
})

module.exports = router;