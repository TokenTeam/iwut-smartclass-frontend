import NativeRPC from '@token-team/native-rpc-h5';

type AppInfo = {
  appId: string;
  appName: string;
  appVersion: 1;
  systemVersion: 1;
};

NativeRPC.call<AppInfo>("app.info").then((res) => {
  console.log(res.appVersion);
});

interface UlplResponse {
  ul: string;
  pl: string;
}

interface SpiderResponse {
  cookies: string;
}

export async function getToken(): Promise<string> {
  try {
    const r = encodeURIComponent("auth/login");
    const forward = encodeURIComponent("https://classroom.lgzk.whut.edu.cn/");
    const redirect_url = encodeURIComponent(
      `https://yjapi.lgzk.whut.edu.cn/casapi/index.php?forward=${forward}&r=${r}&tenant_code=223`
    );
    const redirect_url_login = encodeURIComponent(
      "https://yjapi.lgzk.whut.edu.cn/casapi/index.php?forward=https://classroom.lgzk.whut.edu.cn/&r=auth/login&tenant_code=223"
    );

    const ulplResponse = await NativeRPC.call("spider.getulpl") as UlplResponse;
    const spiderResponse = await NativeRPC.call("spider.run", {
      "spider": "smart_timetable_login_home",
      "newContext": false,
      "params": {
        "ul": ulplResponse.ul,
        "pl": ulplResponse.pl,
        "redirect_url": redirect_url,
        "redirect_url_login": redirect_url_login
      }
    }) as SpiderResponse;

    const tokenMatch = decodeURIComponent(spiderResponse.cookies).match(/(eyJ[a-zA-Z0-9_-]+.[a-zA-Z0-9_-]+.[a-zA-Z0-9_-]+)/);
    const token = tokenMatch ? tokenMatch[1] : '';
    await saveLocalToken(token);
    return token;
  } catch (error) {
    console.error("Failed to fetch token:", error);
    throw error;
  }
}

export async function saveLocalToken(token: string): Promise<undefined> {
  try {
    await NativeRPC.call("storage.set", {
      key: "smartclass.token",
      value: token
    });
  } catch (error) {
    console.error("Failed to save token:", error);
    throw error;
  }
}

export async function getLocalToken(): Promise<string> {
  try {
    const res = await NativeRPC.call<{ value: string }>("storage.get", {
      key: "smartclass.token"
    });
    return res.value;
  } catch (error) {
    console.error("Failed to get token:", error);
    throw error;
  }
}
