import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
export const resend = apiKey && apiKey !== "re_xxxx" ? new Resend(apiKey) : null;

export const EMAIL_FROM = "Gemeindefreizeit 2027 <kontakt@fecg-trossingen-gemeindefreizeit.de>";
export const ADMIN_EMAIL = "kontakt@fecg-trossingen-gemeindefreizeit.de";
