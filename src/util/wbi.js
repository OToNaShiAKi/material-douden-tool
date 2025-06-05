import md5 from "blueimp-md5";

export const GetWBI = (img, sub) => {
  const e =
    img.slice(img.lastIndexOf("/") + 1, img.lastIndexOf(".")) +
    sub.slice(sub.lastIndexOf("/") + 1, sub.lastIndexOf("."));
  const array = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52,
  ];
  let t = "";
  for (let i of array) {
    e.charAt(i) && (t += e.charAt(i));
  }
  return t.slice(0, 32);
};

export const GetRID = (params, wbi) => {
  params.wts = Math.round(Date.now() / 1e3);
  const h = Object.keys(params).sort(),
    u = [],
    d = /[!'()*]/g;
  for (let k of h) {
    let i = params[k];
    i && "string" == typeof i && null != i && (i = i.replace(d, ""));
    i != null && u.push(`${encodeURIComponent(k)}=${encodeURIComponent(i)}`);
  }
  params.w_rid = md5(u.join("&") + wbi);
  return params;
};
