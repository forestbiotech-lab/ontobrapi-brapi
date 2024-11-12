const express = require('express');
const router = express.Router();
const cache = require("./../components/db/cache")
const options = require("./../.config").admin
const external_call = require('./../components/external_calls/brapi')

router.get('/', async function(req, res, next) {
    let results = await cache.query("serverInfo.json",[])


    //TODO get call Structure
    let version="2.0"
    let path=`/admin/brapi/${version}/listcalls/core/serverInfo.json/json`

    let response=await fetch(`${options.protocol}://${options.hostname}:${options.port}${path}`, {
        method: "GET"
    })
    response=await response.json()
    response=external_call.removeInternalMetaDataFromCall(response)

    if(response.result){
        if(response.result.calls) {
            response.result.calls = external_call.refactorServerInfo(results.data)
        }
    }

    res.send(response)
});


router.get('/:version/:service/',async function(req,res,next){
    try{
        // TODO - let requestParams=sanitizeParams(req.query)
        // TODO how do I deal with composed services (a/b), new get
        // TODO Set up a new call for post
        let {version,service}=req.params

        let callInfo=await external_call.getServerInfoForCall(service)
        if(callInfo.data){
            if(callInfo.data.length==1){
                let {module,file}=callInfo.data[0]
                let path=`/admin/brapi/${version}/listcalls/${module}/${file}/result`

                let response=await fetch(`${options.protocol}://${options.hostname}:${options.port}${path}`, {
                    method: "GET"
                })
                response=await response.json()
                response=external_call.removeInternalMetaDataFromCall(response)

                res.json(response)
            }else{
                throw new Error("Call unavailable")
            }
        }else{
            throw new Error("Call unavailable")
        }


        //TODO Get module form callInfo
        //TODO get call from brapi As seen bellow, throw request to admin
        //TODO ignore down below data.

        //TODO security check params based onl


    }catch(err){
        let message=err.message
        res.json({err:message})
    }
})

module.exports = router;