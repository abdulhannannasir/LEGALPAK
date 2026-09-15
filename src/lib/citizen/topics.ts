import {
  Banknote,
  FileWarning,
  HandCoins,
  Home,
  MessageCircleWarning,
  Siren,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { LocalizedText } from "./i18n";

/**
 * The 8 "What happened?" problem cards that are the front door of the
 * Citizen Legal Help experience — each maps to one guided help-desk wizard.
 * Titles are the user's own words, in all three supported languages.
 */
export type Topic = {
  id: string;
  to: string;
  icon: LucideIcon;
  title: LocalizedText;
  body: LocalizedText;
};

export const TOPICS: Topic[] = [
  {
    id: "police-encounter",
    to: "/help-desk/police-encounter",
    icon: Siren,
    title: { en: "Police stopped me", ur: "پولیس نے مجھے روکا", roman: "Police ne mujhe roka" },
    body: {
      en: "Checkpoint stops, searches, FIRs, and bail.",
      ur: "چیک پوسٹ پر روکنا، تلاشی، ایف آئی آر، اور ضمانت۔",
      roman: "Checkpoint par rokna, talashi, FIR, aur zamanat.",
    },
  },
  {
    id: "cyber-report",
    to: "/help-desk/cyber-report",
    icon: MessageCircleWarning,
    title: {
      en: "Someone is threatening me online",
      ur: "کوئی مجھے آن لائن دھمکی دے رہا ہے",
      roman: "Koi mujhe online dhamki de raha hai",
    },
    body: {
      en: "Blackmail, scams, and harassment on WhatsApp or social media.",
      ur: "بلیک میل، فراڈ، اور واٹس ایپ یا سوشل میڈیا پر ہراسانی۔",
      roman: "Blackmail, scam, aur WhatsApp ya social media par harassment.",
    },
  },
  {
    id: "tenant-protection",
    to: "/help-desk/tenant-protection",
    icon: Home,
    title: {
      en: "My landlord is evicting me",
      ur: "میرا مکان مالک مجھے نکال رہا ہے",
      roman: "Mera makan malik mujhe nikaal raha hai",
    },
    body: {
      en: "Lockouts, disconnections, and eviction grounds.",
      ur: "تالا لگانا، سہولتیں منقطع کرنا، اور بے دخلی کی بنیادیں۔",
      roman: "Tala lagana, sahoolatein munqate karna, aur bedakhli ki bunyadein.",
    },
  },
  {
    id: "utility-dispute",
    to: "/help-desk/utility-dispute",
    icon: Zap,
    title: {
      en: "My electricity/gas bill is wrong",
      ur: "میرا بجلی/گیس کا بل غلط ہے",
      roman: "Mera bijli/gas ka bill ghalat hai",
    },
    body: {
      en: "Detection bills and meter-tampering claims.",
      ur: "ڈیٹیکشن بل اور میٹر ٹیمپرنگ کے دعوے۔",
      roman: "Detection bill aur meter tampering ke dawe.",
    },
  },
  {
    id: "bounced-cheque",
    to: "/help-desk/bounced-cheque",
    icon: Banknote,
    title: {
      en: "Someone bounced my cheque",
      ur: "کسی کا چیک باؤنس ہو گیا",
      roman: "Kisi ka cheque bounce ho gaya",
    },
    body: {
      en: "Section 489-F criminal complaint and civil recovery.",
      ur: "دفعہ 489-ایف کی فوجداری شکایت اور دیوانی وصولی۔",
      roman: "Section 489-F ki criminal shikayat aur civil wasooli.",
    },
  },
  {
    id: "recover-money",
    to: "/help-desk/recover-money",
    icon: HandCoins,
    title: {
      en: "I need to recover money",
      ur: "مجھے پیسے واپس لینے ہیں",
      roman: "Mujhe paisay wapas lene hain",
    },
    body: {
      en: "Unpaid loans, invoices, or agreements.",
      ur: "غیر ادا شدہ قرض، انوائس، یا معاہدے۔",
      roman: "Ghair ada shuda qarz, invoice, ya muahiday.",
    },
  },
  {
    id: "succession",
    to: "/help-desk/succession",
    icon: Users,
    title: {
      en: "I have an inheritance issue",
      ur: "مجھے وراثت کا مسئلہ ہے",
      roman: "Mujhe wirasat ka masla hai",
    },
    body: {
      en: "NADRA succession vs. a civil court partition suit.",
      ur: "نادرا سکسیشن بمقابلہ عدالتی تقسیم کا مقدمہ۔",
      roman: "NADRA succession bamuqabla adalati taqseem ka muqadma.",
    },
  },
  {
    id: "legal-notice",
    to: "/help-desk/legal-notice",
    icon: FileWarning,
    title: {
      en: "I need a legal notice",
      ur: "مجھے قانونی نوٹس چاہیے",
      roman: "Mujhe qanooni notice chahiye",
    },
    body: {
      en: "A formal, on-record warning before going to court.",
      ur: "عدالت جانے سے پہلے ایک باضابطہ، ریکارڈ شدہ وارننگ۔",
      roman: "Adalat jane se pehle aik bazabta, record shuda warning.",
    },
  },
];
