import { Bilibili, Login } from "./headers.js";

export const SendComment = async (roomid, msg) => {
  try {
    return await Bilibili.post(
      "/msg/send",
      QS.stringify({
        roomid,
        msg,
        color: 1677215,
        mode: 1,
        bubble: 0,
        fontsize: 25,
        ...Bilibili.defaults.data,
      })
    );
  } catch (error) {
    return error;
  }
};

export const GetQRCode = async () => {
  try {
    const { data } = await Login.get("/qrcode/getLoginUrl", {
      baseURL: "https://passport.bilibili.com/",
    });
    return data;
  } catch (error) {
    return { url: "", oauthKey: "" };
  }
};

export const GetLoginInfo = async (oauthKey) => {
  try {
    return await Login.post(
      "/qrcode/getLoginInfo",
      QS.stringify({ oauthKey }),
      { baseURL: "https://passport.bilibili.com/" }
    );
  } catch (error) {
    return { status: false, data: null };
  }
};
