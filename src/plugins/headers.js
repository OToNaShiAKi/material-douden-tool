import axios from "axios";

export const Bilibili = axios.create({
  baseURL: "https://api.live.bilibili.com/",
  withCredentials: true,
  headers: {
    origin: "https://live.bilibili.com",
    referer: "https://live.bilibili.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});
Bilibili.interceptors.response.use(({ data }) => {
  if (data.code !== 0 && data.code !== 1200000) {
    throw data;
  }
  data.data.message = data.message || data.msg;
  return data.data;
});

export const Login = axios.create({
  baseURL: "https://passport.bilibili.com",
  withCredentials: true,
  headers: {
    origin: "https://www.bilibili.com/",
    referer: "https://www.bilibili.com/",
    Cookie:
      "innersign=0; buvid3=96A61BF3-9872-AD90-2BDD-34A7E068E28323853infoc; i-wanna-go-back=-1; b_ut=7; b_lsid=1018D7EEE_1804B42FFA6; _uuid=58101102110-CAE7-71A1-EB13-D364E7E3E2F1023693infoc; buvid_fp=2c3cd32b4730cef2cdee3324f8c875be; buvid4=E1CB08DE-40C8-9D7B-36BB-54448369229626028-022042116-z1pJSbmBGD48zG9Xxm4xAw%3D%3D; PVID=1",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});
Login.interceptors.response.use(({ data }) => data);

export const Music163 = axios.create({
  baseURL: "https://music.163.com/api/",
  withCredentials: true,
  headers: {
    origin: "https://music.163.com",
    referer: "https://music.163.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  },
});
Music163.interceptors.response.use(({ data }) => {
  if (data.code !== 200) {
    throw data;
  }
  return data;
});

export const MusicQQ = axios.create({
  baseURL: "https://u.y.qq.com/",
  withCredentials: true,
  headers: {
    origin: "https://y.qq.com/",
    referer: "https://y.qq.com/n/ryqq/search",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    Cookie:
      "tvfe_boss_uuid=e6e3514d02a59e64; pgv_pvid=3846552470; RK=t2lsTRDoXA; ptcz=bc1ebb324404afaf2e871630fcc04498f3170e9a5f7a801993b9d399ba0ac44e; o_cookie=1362446747; pac_uid=1_1362446747; iip=0; fqm_pvqid=0f43dbab-37c7-4a1b-b09a-d1b97d32b8c1; ts_refer=www.google.com.hk/; ts_uid=8123348496; tmeLoginType=2; ptui_loginuin=1078433231; fqm_sessionid=c0d1a292-15f4-4d84-82e5-88f1c0d10faf; pgv_info=ssid=s291314040; ts_last=y.qq.com/n/ryqq/search; _qpsvr_localtk=0.7171941336146996; login_type=1; wxunionid=; euin=NKEsoicl7w-F; psrf_qqunionid=57409FB062EBB1FDF61F37076EDC3A52; psrf_access_token_expiresAt=1685417107; psrf_qqopenid=9ADFA0286AA69C06D5A50E2371AA495B; qm_keyst=Q_H_L_5ZJkAbWKejqD9CpJ9gPF0Vp_zwsS5Y-n1vbO0k2N-GdAAwywTJMCupw; uin=996387628; wxrefresh_token=; psrf_qqrefresh_token=6EBCA2FFBDA2D85A62E3E08C8B45070F; qqmusic_key=Q_H_L_5ZJkAbWKejqD9CpJ9gPF0Vp_zwsS5Y-n1vbO0k2N-GdAAwywTJMCupw; psrf_qqaccess_token=1FDFCBAEAFE19C5ECDC440028997BBF3; qm_keyst=Q_H_L_5ZJkAbWKejqD9CpJ9gPF0Vp_zwsS5Y-n1vbO0k2N-GdAAwywTJMCupw; psrf_musickey_createtime=1677641107; wxopenid=",
  },
});
MusicQQ.interceptors.response.use(({ data }) => {
  if (data.code !== 0) {
    throw data;
  }
  return data;
});

export const Baidu = axios.create({
  baseURL: "https://fanyi.baidu.com/",
  withCredentials: true,
  headers: {
    origin: "https://fanyi.baidu.com/",
    referer: "https://fanyi.baidu.com/",
    "sec-ch-ua":
      '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "Windows",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  },
});
Baidu.interceptors.response.use(({ data }) => {
  if (data.error && data.error !== 0) {
    throw data;
  }
  return data;
});

export const API = axios.create({
  baseURL: "http://api.hustmaths.top/",
  withCredentials: true,
  headers: {
    origin: "http://api.hustmaths.top/",
    referer: "http://api.hustmaths.top/",
  },
});
API.interceptors.response.use(({ data }) => {
  if (data.status !== 200) {
    throw data;
  }
  return data;
});
