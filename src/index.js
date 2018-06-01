import sayHello from './hello';
import './index.scss';
import fbSDK from 'load-fb-sdk';
import axios from 'axios';

document.getElementById('root').innerHTML = sayHello();

const FB_APP_SECRET = '{app-secret}';

const fbInitOpts = {
  appId      : '{client-id}',
  cookie     : true,
  xfbml      : true,
  version    : 'v3.0'
};

let _FB = null;

// This must be set before running loadFbSdk() the first time.
window.__LOAD_FB_SDK = fbInitOpts;

let auth = {
  resp: null,
  long_lived: null,
  user: null
};

window.auth = auth;

fbSDK(function (err, FB) {
  if (err) {
    return console.log(err);
  }
  _FB = FB;
  /*_FB.getLoginStatus((res) => {
    auth.resp = res.authResponse;
    window.checkFBPermissions();
  });*/

  _FB.api('/me', {
    access_token: getLongLivedAccessToken(),
    fields: 'id'
  }, (resp) => {
    console.info(resp);
    auth.user = { access_token: getLongLivedAccessToken(), userId: resp.id };
    window.checkFBPermissions();
  });

});

window.exchangeForLongLived = (cb) => {
  _FB.api('/oauth/access_token', 'get', {
    grant_type: 'fb_exchange_token',
    client_id: fbInitOpts.appId,
    client_secret: FB_APP_SECRET,
    fb_exchange_token: (auth.resp && auth.resp.accessToken) || auth.user.access_token,
  }, (resp) => {
    console.info('Exchange For Long Lived', resp);
    localStorage.long_lived = JSON.stringify(resp);
    auth.user.access_token = resp.access_token;
  });
};

window.getSelected = (elem) => {
  const values = [];
  for (var i = 0; i < elem.options.length; i++) {
    if (elem.options[i].selected) {
      values.push(elem.options[i].value);
    }
  }
  return values;
};

window.loginWithSelected = (selected) => {
  const scope = selected.join(',');
  _FB.login(defaultOnLogin, {
    scope
  });
};

const defaultOnLogin = (resp) => {
  auth.resp = resp.authResponse;
  if (!auth.user) {
    auth.user = {}
  }
  console.info('defaultOnLogin', resp);
  auth.user.userId = resp.authResponse.userID;
  window.exchangeForLongLived(window.checkFBPermissions);
};

window.getLongLivedAccessToken = () => {
  if (localStorage.long_lived) {
    return JSON.parse(localStorage.long_lived).access_token;
  }
};

window.checkFBPermissions = (oResp, cb) => {
  const { user } = auth;
  if (user) {
    const { userId } = user;
    _FB.api(`${userId}/permissions`, {
      access_token: getLongLivedAccessToken()
    }, (resp) => {
      const options = ['<option value="">--- SELECT PERMISSION ---</option>'];
      const tableRows = [];
      if (resp.data) {
        console.info(resp);
        for (var i = 0; i < resp.data.length; i++) {
          options.push(`<option value="${resp.data[i].permission}">${resp.data[i].permission} - (${resp.data[i].status})</option>`);
          if (i == 0) {
            tableRows.push('<tr><th>Permission</th><th>Status</th></tr>');
          }
          tableRows.push(`<tr><td>${resp.data[i].permission}</td><td>${resp.data[i].status}</td></tr>`);
        }
      }
      document.getElementById('PERMISSIONS').innerHTML = options.join('');
      document.getElementById('PERMISSIONS_TABLE').innerHTML = tableRows.join('');
    });
  }
  if (typeof cb === 'function') {
    cb(oResp);
  }
};

window.revokeAllPermissions = () => {
  const { user } = auth;
  if (user) {
    const { userId } = user;
    _FB.api(`${userId}/permissions`, 'delete', {
      access_token: getLongLivedAccessToken()
    }, (resp) => {
      console.info(resp);
      if(resp.error) {
        console.error(resp.error);
      } else {
        window.checkFBPermissions(resp, () => { alert('Permissions Revoked'); });
      }
    });
  }
};

window.revokePermission = (permission) => {
  if (!permission) { return; }
  const { user } = auth;
  if (user) {
    const { userId } = user;
    _FB.api(`${userId}/permissions/${permission}`, 'delete', {
      access_token: getLongLivedAccessToken()
    }, (resp) => {
      console.info(resp);
      console.info(`Permission ${permission} revoked`);
      window.checkFBPermissions();
    });
  }
};

window.getUserLikes = () => {
  const { user } = auth;
  if (user) {
    const { userId } = user;
    _FB.api(`${userId}/likes`, {
      access_token: getLongLivedAccessToken()
    }, (resp) => {
      console.info(resp);
    });
  }
};

window.getPages = () => {
  const { user } = auth;
  if (user) {
    const { userId } = user;
    _FB.api('me/accounts', {
      access_token: getLongLivedAccessToken()
    }, (resp) => {
      console.info(resp);
    });
  }
};
