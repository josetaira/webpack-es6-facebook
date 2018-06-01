import sayHello from './hello';
import './index.scss';
import fbSDK from 'load-fb-sdk';

document.getElementById('root').innerHTML = sayHello();

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
  resp: null
};
window.auth = auth;

fbSDK(function (err, FB) {
  if (err) {
    return console.log(err);
  }
  _FB = FB;
  _FB.getLoginStatus((res) => {
    auth.resp = res.authResponse;
    window.checkFBPermissions();
  });
});

window.onClickFBButton = () => {
  _FB.login(defaultOnLogin);
};

window.tryPost = () => {

};

window.loginWithManagePages = () => {
  _FB.login(defaultOnLogin, {
    scope: 'manage_pages'
  });
};

window.loginWithPublishPages = () => {
  _FB.login(defaultOnLogin, {
    scope: 'publish_pages'
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
  window.checkFBPermissions();
};

window.checkFBPermissions = (oResp, cb) => {
  const { resp } = auth;
  if (resp) {
    const { userID } = resp;
    _FB.api(`${userID}/permissions`, (resp) => {
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
  const { resp } = auth;
  if (resp) {
    const { userID } = resp;
    _FB.api(`${userID}/permissions`, 'delete', (resp) => {
      console.info(resp);
      window.checkFBPermissions(resp, () => { alert('Permissions Revoked'); });
    });
  }
};

window.revokePermission = (permission) => {
  if (!permission) { return; }
  const { resp } = auth;
  if (resp) {
    const { userID } = resp;
    _FB.api(`${userID}/permissions/${permission}`, 'delete', (resp) => {
      console.info(resp);
      console.info(`Permission ${permission} revoked`);
      window.checkFBPermissions();
    });
  }
};

window.getUserLikes = () => {
  const { resp } = auth;
  if (resp) {
    const { userID } = resp;
    _FB.api(`${userID}/likes`, (resp) => {
      console.info(resp);
    });
  }
};

window.getPages = () => {
  const { resp } = auth;
  if (resp) {
    const { userID } = resp;
    _FB.api('me/accounts', (resp) => {
      console.info(resp);
    });
  }
};
