var fs = require('fs')
, url = require('url')
, http = require('http')
, https = require('https')
, mkdirp = require('mkdirp')
, JobQueue = require('job-queues');

function download(file, options, callback) {

    if (!file) throw("Need a file url to download"); 

    if (!callback && typeof options === 'function') {
        callback = options; }

    // options parameter
    options = typeof options === 'object' ? options : {};
    // request timeout
    options.timeout = options.timeout || 200000; // file save directory
    // file directory
    options.directory = options.directory ? options.directory : './download';
    // retry times before failed
    options.retry = options.retry ? options.retry : 10; 
    // delay before retry
    options.retryDelay = options.retryDelay ? options.delay : 1000; 

    // parse url
    var uri = file.split('/');
    // parse filename
    options.filename = options.filename || uri[uri.length - 1];

    var path = options.directory + "/" + options.filename; 

    if (url.parse(file).protocol === null) {
        file = 'http://' + file;
        req = http;
    } else if (url.parse(file).protocol === 'https:') {
        req = https;
    } else {
        req = http;
    }


    var fetchRetry = function(n){

        if(options.log)
          console.log("Fetching ... ", file);

        var request = req.get(file, function(response) {

            if (response.statusCode === 200) {

                mkdirp(options.directory, function(err) { 
                    if (err) throw err;
                    var file = fs.createWriteStream(path);
                    response.pipe(file);
                });
            } else {

                if (callback) callback(response.statusCode);
            }

            response.on("end", function(){

                if (callback) callback(false, path);
            });

        }).on('error', function(e) {

            request.abort();

            console.error("Error: Connection error on request " + file);
            console.error("Retry: Retry on request " + file);
            console.error("Retry: Retry left " + n);

            if(n > 0){
                setTimeout(function(){
                    fetchRetry(--n);
                }, options.retryDelay);
            }else{
                if(callback) callback(e);
            }

        });
        /*
        .setTimeout(options.timeout)
        .on('timeout', function(){

                //request.abort();

                console.error("Error: timeout on request " + file);
                console.error("Retry: Retry on request " + file);
                console.error("Retry: Retry left " + n);

                if(n > 0){
                    setTimeout(function(){
                        fetchRetry(--n);
                    }, options.retryDelay);
                }else{
                    if(callback) callback("Timeout");
                }

        });
         * */

        // note: request.abort() will generate 'error' event
        // 


    }

    fetchRetry(options.retry);

}

function BatchDownload(options, callback) {

    if (!callback && typeof options === 'function') {
        callback = options;
    }

    // options parameter
    options = typeof options === 'object' ? options : {};

    if (!options.address) throw("Need options.address to download");

    var nPattern = options.address.match(/\*/gi).length;

    if ( 0 == nPattern ) throw("Need a * pattern to start");
    if ( nPattern > 1 ) throw("Only one * pattern is needed");

    // pattern start from
    options.from = options.from || 0;
    // pattern ends to 
    options.to = options.to || 999;
    // wild card matching size
    options.wildcardSize = options.wildcardSize || 3; 

		function* gen(){
				for(let i = options.from; i < options.to; ++i){
						var repRe = /(.*)\*(.*)/i
            yield {
                address: options.address.replace(repRe, '$1' + i + '$2'),
                index: i
            };
				}
		}

    JobQueue(
            {}, 
            gen(), 
            function(job, done){
                options.filename = options.fileName.replace(/(.*)\*(.*)/i, '$1' + job.value.index + '$2');
                download(job.value.address, options, function(){done();});
            }, 
            callback
            );

}

module.exports = BatchDownload; 
