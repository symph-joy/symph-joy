import _fetch from 'isomorphic-fetch'
import request from 'request'

async function getJSONBody(req) {
  return new Promise(((resolve, reject) => {
    let body = null;
    if (req.body) {
      // 已经解析过body
      let type = (typeof req.body);
      if (type === 'string') {
        body = JSON.parse(req.body)
      } else {
        body = req.body
      }
    } else {
      const chunks = [];
      req.on('data', function (chunk) {
        chunks.push(chunk)
      });
      req.on('end', function () {
        let strBody = chunks.join('');
        if(strBody.length > 0){
          console.log('>>>> getBody:'+ strBody)
          body = JSON.parse(strBody)
        }

        if (body) {
          resolve(body)
        } else {
          reject(null)
        }

      });
    }
  }))
}

const REG_GET_METHODS = ['GET', 'HEAD', 'DELETE', 'OPTIONS'];
const REG_POST_METHODS = ['POST','PUT', 'PATCH'];

async function proxy(req, res, next) {
  if (!/^\/__proxy/i.test(req.url)) {
    next()
    return
  }

  let uri = req.query.uri;
  if( !uri) {
    res.send('the url is required');
    res.end();
    return
  }
  // let method = (req.method || 'GET').toLocaleUpperCase();
  // let contentType = req.get('Content-Type');
  // let headerNames = req.get('__Payload');
  // let body = null;
  //
  // console.log(`>>>> api proxy start,${process.uptime()}, method:${method}, uri:${uri}, headers:${headerNames}`);
  //
  // const sOptions = {
  //   url: uri,
  //   method,
  // };

  req.pipe(request(uri)).pipe(res)


}

export default proxy
