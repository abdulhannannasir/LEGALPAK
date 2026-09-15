import type { LocalizedText } from "./i18n";

/**
 * The structured, plain-language guidance shown on step 2 of every help-desk
 * wizard: what may be happening, what to do now, what evidence to keep, and
 * when a lawyer becomes necessary. This is fixed, reviewed content (not
 * AI-generated) — the wizard's own triage answers (offense type, province,
 * route, etc.) pick which bullets to show where a topic has more than one.
 */
export type GuidanceContent = {
  whatMayBeHappening: LocalizedText;
  whatYouCanDoNow: LocalizedText[];
  evidenceToPreserve: LocalizedText[];
  whenToContactLawyer: LocalizedText;
};

export const GUIDANCE: Record<string, GuidanceContent> = {
  "police-encounter": {
    whatMayBeHappening: {
      en: "You may be facing a routine checkpoint stop, a search, or the start of a criminal investigation. Your rights differ depending on whether you are simply being questioned or are under arrest.",
      ur: "ہو سکتا ہے یہ ایک عام چیک پوسٹ کی روک تھام، تلاشی، یا کسی فوجداری تحقیقات کا آغاز ہو۔ آپ کے حقوق اس بات پر منحصر ہیں کہ آپ سے صرف پوچھ گچھ ہو رہی ہے یا آپ گرفتار ہیں۔",
      roman: "Ho sakta hai yeh aik aam checkpoint stop, talashi, ya kisi criminal investigation ka aghaz ho. Aap ke haqooq is baat par depend karte hain keh aap se sirf pochgachh ho rahi hai ya aap giraftar hain.",
    },
    whatYouCanDoNow: [
      {
        en: "Stay calm, ask for the officer's name, badge number, and the police post/vehicle.",
        ur: "پرسکون رہیں، افسر کا نام، بیج نمبر، اور تھانہ/گاڑی کی تفصیل پوچھیں۔",
        roman: "Pursukoon rahain, officer ka naam, badge number, aur thana/gaari ki tafseel poochain.",
      },
      {
        en: "You may not have to hand over your phone without a warrant or your informed consent.",
        ur: "وارنٹ یا آپ کی باخبر رضامندی کے بغیر آپ کا فون دینا ضروری نہیں۔",
        roman: "Warrant ya aap ki bakhabar razamandi ke baghair aap ka phone dena zaroori nahi.",
      },
      {
        en: "If arrested, you must be produced before a Magistrate within 24 hours.",
        ur: "گرفتاری کی صورت میں 24 گھنٹوں کے اندر مجسٹریٹ کے سامنے پیش کیا جانا لازمی ہے۔",
        roman: "Giraftari ki surat mein 24 ghanton ke andar Magistrate ke samne pesh kiya jana lazmi hai.",
      },
      {
        en: "Check below whether the offence is cognizable (FIR filed directly) or needs a Magistrate's order first.",
        ur: "نیچے چیک کریں کہ جرم قابلِ دست اندازی ہے (براہِ راست ایف آئی آر) یا پہلے مجسٹریٹ کے حکم کی ضرورت ہے۔",
        roman: "Neeche check karein keh jurm qabil-e-dast andazi hai (seedha FIR) ya pehle Magistrate ke hukum ki zaroorat hai.",
      },
    ],
    evidenceToPreserve: [
      {
        en: "Note the date, time, location, and officer/vehicle details.",
        ur: "تاریخ، وقت، جگہ، اور افسر/گاڑی کی تفصیلات نوٹ کریں۔",
        roman: "Tareekh, waqt, jagah, aur officer/gaari ki tafseelat note karein.",
      },
      {
        en: "Ask for a copy of any recovery memo, seizure list, or FIR.",
        ur: "ریکوری میمو، ضبطی فہرست، یا ایف آئی آر کی کاپی مانگیں۔",
        roman: "Recovery memo, zabti fehrist, ya FIR ki copy maangein.",
      },
      {
        en: "If injured, get a medico-legal certificate (MLC) as soon as possible.",
        ur: "اگر زخمی ہوں تو جلد از جلد میڈیکو لیگل سرٹیفکیٹ (ایم ایل سی) بنوائیں۔",
        roman: "Agar zakhmi hon to jald az jald medico-legal certificate (MLC) banwayen.",
      },
      {
        en: "Keep contact details of anyone who witnessed the stop.",
        ur: "جو لوگ اس واقعے کے گواہ ہوں ان کی رابطہ تفصیلات محفوظ رکھیں۔",
        roman: "Jo log is waqiye ke gawah hon un ki rabta tafseelat mehfooz rakhein.",
      },
    ],
    whenToContactLawyer: {
      en: "Contact an advocate immediately if an FIR is registered against you, you are arrested, or you anticipate arrest — pre-arrest bail has strict timelines.",
      ur: "اگر آپ کے خلاف ایف آئی آر درج ہو، آپ گرفتار ہوں، یا گرفتاری کا خدشہ ہو تو فوراً وکیل سے رابطہ کریں — ضمانتِ قبل از گرفتاری کی سخت وقتی حدیں ہیں۔",
      roman: "Agar aap ke khilaf FIR darj ho, aap giraftar hon, ya giraftari ka khadsha ho to foran wakeel se rabta karein — zamanat-e-qabl az giraftari ki sakht waqti hadain hain.",
    },
  },

  "cyber-report": {
    whatMayBeHappening: {
      en: "This may be cyber harassment, blackmail, or a financial scam under Pakistan's cybercrime law (PECA 2016), even if no money has changed hands yet.",
      ur: "یہ سائبر ہراسانی، بلیک میلنگ، یا مالی فراڈ ہو سکتا ہے جو پاکستان کے سائبر کرائم قانون (پیکا 2016) کے تحت آتا ہے، چاہے ابھی تک کوئی رقم منتقل نہ ہوئی ہو۔",
      roman: "Yeh cyber harassment, blackmailing, ya financial scam ho sakta hai jo Pakistan ke cybercrime qanoon (PECA 2016) ke tehat aata hai, chahay abhi tak koi raqam muntaqil na hui ho.",
    },
    whatYouCanDoNow: [
      {
        en: "Do not pay any money demanded and do not block the account yet — blocking can stop evidence collection.",
        ur: "مطالبہ کردہ رقم ہرگز ادا نہ کریں اور ابھی اکاؤنٹ بلاک نہ کریں — بلاک کرنے سے ثبوت اکٹھا کرنا رک سکتا ہے۔",
        roman: "Mutaliba karda raqam hargiz ada na karein aur abhi account block na karein — block karne se saboot ikatha karna ruk sakta hai.",
      },
      {
        en: "Do not delete any chats, posts, or messages.",
        ur: "کوئی چیٹ، پوسٹ، یا پیغام ڈیلیٹ نہ کریں۔",
        roman: "Koi chat, post, ya paigham delete na karein.",
      },
      {
        en: "Report to the NCCIA/FIA Cybercrime Wing (helpline 1799) or cybercrime.gov.pk.",
        ur: "این سی سی آئی اے / ایف آئی اے سائبر کرائم ونگ (ہیلپ لائن 1799) یا cybercrime.gov.pk پر رپورٹ کریں۔",
        roman: "NCCIA/FIA Cybercrime Wing (helpline 1799) ya cybercrime.gov.pk par report karein.",
      },
      {
        en: "If you feel unsafe, also involve someone you trust and consider the police helpline 15.",
        ur: "اگر خود کو غیر محفوظ محسوس کریں تو کسی قابلِ اعتماد شخص کو بھی بتائیں اور پولیس ہیلپ لائن 15 پر رابطہ کریں۔",
        roman: "Agar khud ko ghair mehfooz mehsoos karein to kisi qabil-e-aitmaad shaks ko bhi batayein aur police helpline 15 par rabta karein.",
      },
    ],
    evidenceToPreserve: [
      {
        en: "Full-screen screenshots showing date/time and the username or URL bar.",
        ur: "تاریخ/وقت اور یوزرنیم یا یو آر ایل بار دکھاتے ہوئے فل اسکرین اسکرین شاٹس لیں۔",
        roman: "Tareekh/waqt aur username ya URL bar dikhate huay full-screen screenshots lein.",
      },
      {
        en: "Original photos/videos/voice notes, unedited and uncompressed.",
        ur: "اصل تصاویر/ویڈیوز/وائس نوٹس، بغیر ترمیم اور کمپریس کیے محفوظ کریں۔",
        roman: "Asal tasaweer/videos/voice notes, baghair tarmeem aur compress kiye mehfooz karein.",
      },
      {
        en: "An exported copy of the chat (e.g. WhatsApp export chat) emailed to yourself.",
        ur: "چیٹ کی ایکسپورٹ کردہ کاپی (مثلاً واٹس ایپ ایکسپورٹ چیٹ) اپنے ای میل پر بھیجیں۔",
        roman: "Chat ki export karda copy (maslan WhatsApp export chat) apne email par bhejein.",
      },
      {
        en: "The offender's exact profile link, phone number, or account details.",
        ur: "مجرم کا صحیح پروفائل لنک، فون نمبر، یا اکاؤنٹ کی تفصیلات نوٹ کریں۔",
        roman: "Mujrim ka sahi profile link, phone number, ya account ki tafseelat note karein.",
      },
    ],
    whenToContactLawyer: {
      en: "Involve an advocate once a complaint is lodged if the matter needs a private complaint, bail, or court proceedings — the FIA can register and investigate without one.",
      ur: "شکایت درج ہونے کے بعد اگر معاملے میں پرائیویٹ شکایت، ضمانت، یا عدالتی کارروائی درکار ہو تو وکیل سے رابطہ کریں — ایف آئی اے وکیل کے بغیر بھی درخواست درج اور تحقیقات کر سکتی ہے۔",
      roman: "Shikayat darj hone ke baad agar mamle mein private shikayat, zamanat, ya adalati karwai darkar ho to wakeel se rabta karein — FIA wakeel ke baghair bhi darkhwast darj aur tehqeeqat kar sakti hai.",
    },
  },

  "tenant-protection": {
    whatMayBeHappening: {
      en: "Your landlord may be trying to remove you without following the legal eviction process — a lockout or utility disconnection without a tribunal order is itself unlawful, regardless of the underlying dispute.",
      ur: "ہو سکتا ہے آپ کا مکان مالک قانونی طریقہ اپنائے بغیر آپ کو نکالنے کی کوشش کر رہا ہو — ٹریبونل کے حکم کے بغیر تالا لگانا یا سہولتیں منقطع کرنا خود بھی غیر قانونی ہے، چاہے اصل تنازع کچھ بھی ہو۔",
      roman: "Ho sakta hai aap ka makan malik qanooni tareeqa apnaye baghair aap ko nikalne ki koshish kar raha ho — tribunal ke hukum ke baghair tala lagana ya sahoolatein munqate karna khud bhi ghair qanooni hai, chahay asal tanaza kuch bhi ho.",
    },
    whatYouCanDoNow: [
      {
        en: "Do not vacate or hand over keys because of threats alone — insist on a lawful order from the Rent Controller/Tribunal.",
        ur: "صرف دھمکیوں کی وجہ سے گھر خالی نہ کریں یا چابیاں نہ دیں — رینٹ کنٹرولر/ٹریبونل کے قانونی حکم پر اصرار کریں۔",
        roman: "Sirf dhamkiyon ki wajah se ghar khali na karein ya chabiyan na dein — Rent Controller/Tribunal ke qanooni hukum par israr karein.",
      },
      {
        en: "Send the objection notice below to put the landlord on formal record.",
        ur: "مکان مالک کو باضابطہ طور پر آگاہ کرنے کے لیے نیچے دیا گیا اعتراضی نوٹس بھیجیں۔",
        roman: "Makan malik ko bazabta tor par agah karne ke liye neeche diya gaya aitrazi notice bhejein.",
      },
      {
        en: "If utilities are cut off, you can seek restoration through the Rent Tribunal.",
        ur: "اگر سہولتیں منقطع ہو جائیں تو رینٹ ٹریبونل کے ذریعے بحالی کی درخواست دے سکتے ہیں۔",
        roman: "Agar sahoolatein munqate ho jayen to Rent Tribunal ke zariye bahali ki darkhwast de saktay hain.",
      },
      {
        en: "Keep paying/offering rent on time so your standing as a tenant is not weakened.",
        ur: "کرایہ وقت پر ادا کرتے رہیں یا پیش کرتے رہیں تاکہ بطور کرایہ دار آپ کی حیثیت کمزور نہ ہو۔",
        roman: "Kiraya waqt par ada karte rahein ya pesh karte rahein taake bator kirayadar aap ki haisiyat kamzor na ho.",
      },
    ],
    evidenceToPreserve: [
      {
        en: "Rent receipts or bank/mobile-wallet transfer records.",
        ur: "کرائے کی رسیدیں یا بینک/موبائل والیٹ ٹرانسفر کا ریکارڈ۔",
        roman: "Kiraye ki raseedain ya bank/mobile wallet transfer ka record.",
      },
      {
        en: "The tenancy agreement, if any, and any prior written notices.",
        ur: "کرایہ داری کا معاہدہ اگر موجود ہو، اور پہلے بھیجے گئے تحریری نوٹس۔",
        roman: "Kirayadari ka muahida agar mojood ho, aur pehlay bheje gaye tehreeri notice.",
      },
      {
        en: "Photos/video of any lockout, damage, or disconnection, with date and time.",
        ur: "تالا لگانے، نقصان، یا سہولت منقطع ہونے کی تصاویر/ویڈیو، تاریخ اور وقت کے ساتھ۔",
        roman: "Tala lagane, nuqsan, ya sahoolat munqate hone ki tasaweer/video, tareekh aur waqt ke sath.",
      },
      {
        en: "Names and contact details of witnesses (neighbours, guards).",
        ur: "گواہوں (پڑوسی، گارڈ) کے نام اور رابطہ نمبر۔",
        roman: "Gawahon (parosi, guard) ke naam aur rabta number.",
      },
    ],
    whenToContactLawyer: {
      en: "Contact an advocate if the landlord files (or threatens) an eviction case, or if a lockout/disconnection actually happens — you may need an urgent injunction.",
      ur: "اگر مکان مالک بے دخلی کا مقدمہ دائر کرے (یا دھمکی دے)، یا تالا لگنے/سہولت منقطع ہونے کا واقعہ پیش آئے تو وکیل سے رابطہ کریں — آپ کو فوری حکمِ امتناعی درکار ہو سکتا ہے۔",
      roman: "Agar makan malik bedakhli ka muqadma dair kare (ya dhamki de), ya tala lagne/sahoolat munqate hone ka waqia pesh aaye to wakeel se rabta karein — aap ko fori hukm-e-imtinaee darkar ho sakta hai.",
    },
  },

  "utility-dispute": {
    whatMayBeHappening: {
      en: "This looks like it could be a detection/meter-tampering bill rather than ordinary consumption — such charges are only valid if a proper inspection and notice were given first.",
      ur: "یہ عام استعمال کے بجائے ڈیٹیکشن/میٹر ٹیمپرنگ بل لگتا ہے — ایسا چارج تب ہی درست ہے جب پہلے مناسب معائنہ اور نوٹس دیا گیا ہو۔",
      roman: "Yeh aam istemal ke bajaye detection/meter tampering bill lagta hai — aisa charge tabhi durust hai jab pehle munasib muaina aur notice diya gaya ho.",
    },
    whatYouCanDoNow: [
      {
        en: "Do not pay the disputed amount before an independent re-inspection, though keep paying your normal average bill to avoid disconnection on that basis.",
        ur: "آزادانہ دوبارہ معائنے سے پہلے متنازع رقم ادا نہ کریں، البتہ اپنا معمول کا اوسط بل ادا کرتے رہیں تاکہ اس بنیاد پر سپلائی منقطع نہ ہو۔",
        roman: "Azadana dobara muaine se pehle mutanaza raqam ada na karein, albatta apna mamool ka average bill ada karte rahein taake is bunyad par supply munqate na ho.",
      },
      {
        en: "Request a copy of the inspection report the bill relies on.",
        ur: "بل کی بنیاد بننے والی معائنہ رپورٹ کی کاپی طلب کریں۔",
        roman: "Bill ki bunyad banne wali muaina report ki copy talab karein.",
      },
      {
        en: "Send the representation letter below to the provider and the NEPRA Consumer Affairs Tribunal or Wafaqi Mohtasib (overbilling helpline 1055).",
        ur: "نیچے دی گئی نمائندگی کی درخواست فراہم کنندہ اور نیپرا کنزیومر افیئرز ٹریبونل یا وفاقی محتسب (اوور بلنگ ہیلپ لائن 1055) کو بھیجیں۔",
        roman: "Neeche di gayi numaindagi ki darkhwast provider aur NEPRA Consumer Affairs Tribunal ya Wafaqi Mohtasib (overbilling helpline 1055) ko bhejein.",
      },
      {
        en: "File in person at the provider's customer service centre and keep a dated receiving.",
        ur: "فراہم کنندہ کے کسٹمر سروس سینٹر پر خود جا کر جمع کروائیں اور تاریخ والی رسید محفوظ رکھیں۔",
        roman: "Provider ke customer service center par khud ja kar jama karwayein aur tareekh wali receiving mehfooz rakhein.",
      },
    ],
    evidenceToPreserve: [
      {
        en: "Your last six months of bills, and the disputed bill.",
        ur: "پچھلے چھ ماہ کے بل اور متنازع بل محفوظ رکھیں۔",
        roman: "Pichlay chhe maah ke bill aur mutanaza bill mehfooz rakhein.",
      },
      {
        en: "Any inspection report, notice, or photos of the meter.",
        ur: "کوئی بھی معائنہ رپورٹ، نوٹس، یا میٹر کی تصاویر۔",
        roman: "Koi bhi muaina report, notice, ya meter ki tasaweer.",
      },
      {
        en: "Proof of dispatch (registered post/courier receipt) once you send the letter.",
        ur: "خط بھیجنے کے بعد ارسال کا ثبوت (رجسٹرڈ ڈاک/کورئیر رسید) محفوظ رکھیں۔",
        roman: "Khat bhejne ke baad irsaal ka saboot (registered post/courier receipt) mehfooz rakhein.",
      },
      {
        en: "Names of anyone present during any inspection visit.",
        ur: "معائنے کے دوران موجود افراد کے نام نوٹ کریں۔",
        roman: "Muaine ke dauran mojood afraad ke naam note karein.",
      },
    ],
    whenToContactLawyer: {
      en: "Escalate to an advocate if the provider disconnects your supply, refuses to re-inspect, or the disputed amount is large and the internal/regulatory complaint doesn't resolve it.",
      ur: "اگر فراہم کنندہ سپلائی منقطع کر دے، دوبارہ معائنے سے انکار کرے، یا رقم بڑی ہو اور اندرونی/ریگولیٹری شکایت سے حل نہ نکلے تو وکیل سے رابطہ کریں۔",
      roman: "Agar provider supply munqate kar de, dobara muaine se inkar kare, ya raqam bari ho aur andaroni/regulatory shikayat se hal na nikle to wakeel se rabta karein.",
    },
  },

  "bounced-cheque": {
    whatMayBeHappening: {
      en: "A dishonoured cheque given toward a genuine debt can be both a criminal offence (Section 489-F PPC) and a civil debt you can recover — the two tracks can run together.",
      ur: "ایک حقیقی قرض کے عوض دیا گیا باؤنس چیک بیک وقت فوجداری جرم (دفعہ 489-ایف تعزیراتِ پاکستان) اور قابلِ وصول دیوانی قرض دونوں ہو سکتا ہے — دونوں راستے ساتھ چل سکتے ہیں۔",
      roman: "Aik haqiqi qarz ke ewaz diya gaya bounce cheque bik waqt criminal jurm (Section 489-F PPC) aur qabil-e-wasool civil qarz dono ho sakta hai — dono raastay sath chal sakte hain.",
    },
    whatYouCanDoNow: [
      {
        en: "Send a legal notice demanding payment within 30 days before taking further action — see the notice below.",
        ur: "مزید کارروائی سے پہلے 30 دن کے اندر ادائیگی کا مطالبہ کرتے ہوئے قانونی نوٹس بھیجیں — نیچے نوٹس دیکھیں۔",
        roman: "Mazeed karwai se pehle 30 din ke andar adaigi ka mutaliba karte huay legal notice bhejein — neeche notice dekhein.",
      },
      {
        en: "Keep the original dishonoured cheque and the bank's return memo safe.",
        ur: "اصل باؤنس شدہ چیک اور بینک کا ریٹرن میمو محفوظ رکھیں۔",
        roman: "Asal bounce shuda cheque aur bank ka return memo mehfooz rakhein.",
      },
      {
        en: "If payment isn't made after the notice period, you can file a criminal complaint under Section 489-F PPC and/or a civil recovery suit.",
        ur: "اگر نوٹس کی مدت کے بعد بھی ادائیگی نہ ہو تو دفعہ 489-ایف کے تحت فوجداری شکایت اور/یا دیوانی وصولی کا دعویٰ دائر کر سکتے ہیں۔",
        roman: "Agar notice ki muddat ke baad bhi adaigi na ho to Section 489-F ke tehat criminal shikayat aur/ya civil wasooli ka dawa dair kar sakte hain.",
      },
      {
        en: "A summary suit under Order XXXVII CPC can be faster than a regular civil suit for a cheque-based debt.",
        ur: "چیک پر مبنی قرض کے لیے آرڈر 37 سی پی سی کے تحت سمری سوٹ عام دیوانی مقدمے سے تیز ہو سکتا ہے۔",
        roman: "Cheque par mabni qarz ke liye Order XXXVII CPC ke tehat summary suit aam civil muqadme se tez ho sakta hai.",
      },
    ],
    evidenceToPreserve: [
      {
        en: "The original cheque and the bank's dishonour/return memo.",
        ur: "اصل چیک اور بینک کا ڈس آنر/ریٹرن میمو۔",
        roman: "Asal cheque aur bank ka dishonour/return memo.",
      },
      {
        en: "Any written agreement, invoice, or message showing what the cheque was for.",
        ur: "چیک کس مقصد کے لیے تھا اس کا کوئی تحریری معاہدہ، انوائس، یا پیغام۔",
        roman: "Cheque kis maqsad ke liye tha iska koi tehreeri muahida, invoice, ya paigham.",
      },
      {
        en: "Proof of dispatch of your legal notice (registered post receipt).",
        ur: "قانونی نوٹس بھیجنے کا ثبوت (رجسٹرڈ ڈاک کی رسید)۔",
        roman: "Legal notice bhejne ka saboot (registered post ki receipt).",
      },
      {
        en: "Any prior payment reminders or communication with the issuer.",
        ur: "چیک جاری کرنے والے سے پہلے کی گئی یاد دہانی یا بات چیت کا ریکارڈ۔",
        roman: "Cheque jari karne wale se pehle ki gayi yaad-dahani ya baat cheet ka record.",
      },
    ],
    whenToContactLawyer: {
      en: "Contact an advocate once the notice period expires without payment, to file the criminal complaint or civil suit correctly.",
      ur: "نوٹس کی مدت بغیر ادائیگی کے ختم ہونے پر، فوجداری شکایت یا دیوانی مقدمہ درست طریقے سے دائر کرنے کے لیے وکیل سے رابطہ کریں۔",
      roman: "Notice ki muddat baghair adaigi ke khatam hone par, criminal shikayat ya civil muqadma durust tareeqe se dair karne ke liye wakeel se rabta karein.",
    },
  },

  "recover-money": {
    whatMayBeHappening: {
      en: "You may be owed money under a loan, unpaid invoice, or agreement — Pakistani law gives you both an out-of-court demand route and a court route, and the right one depends on how the debt was created.",
      ur: "ہو سکتا ہے آپ کا قرض، غیر ادا شدہ انوائس، یا معاہدے کے تحت پیسہ واجب الادا ہو — پاکستانی قانون عدالت سے باہر مطالبے اور عدالتی، دونوں راستے دیتا ہے، اور صحیح راستہ اس بات پر منحصر ہے کہ قرض کیسے وجود میں آیا۔",
      roman: "Ho sakta hai aap ka qarz, ghair ada shuda invoice, ya muahide ke tehat paisa wajib-ul-ada ho — Pakistani qanoon adalat se bahar mutalba aur adalati, dono raastay deta hai, aur sahi raasta is baat par depend karta hai keh qarz kaise wajood mein aaya.",
    },
    whatYouCanDoNow: [
      {
        en: "Send a formal legal notice demanding payment with a clear deadline — see the notice below.",
        ur: "واضح ڈیڈ لائن کے ساتھ ادائیگی کا مطالبہ کرتے ہوئے باضابطہ قانونی نوٹس بھیجیں — نیچے نوٹس دیکھیں۔",
        roman: "Wazeh deadline ke sath adaigi ka mutaliba karte huay bazabta legal notice bhejein — neeche notice dekhein.",
      },
      {
        en: "If the debt is based on a written promise, cheque, or acknowledged account, a summary suit under Order XXXVII CPC can be faster than a regular suit.",
        ur: "اگر قرض تحریری وعدے، چیک، یا تسلیم شدہ کھاتے پر مبنی ہے تو آرڈر 37 سی پی سی کے تحت سمری سوٹ عام مقدمے سے تیز ہو سکتا ہے۔",
        roman: "Agar qarz tehreeri waade, cheque, ya tasleem shuda khate par mabni hai to Order XXXVII CPC ke tehat summary suit aam muqadme se tez ho sakta hai.",
      },
      {
        en: "Otherwise, a regular civil recovery suit can be filed — but check the 3-year limitation period under the Limitation Act, 1908.",
        ur: "بصورتِ دیگر عام دیوانی وصولی کا مقدمہ دائر کیا جا سکتا ہے — لیکن لیمیٹیشن ایکٹ 1908 کے تحت 3 سالہ حدِ مدت کا خیال رکھیں۔",
        roman: "Bsoorat-e-deegar aam civil wasooli ka muqadma dair kiya ja sakta hai — lekin Limitation Act 1908 ke tehat 3 sala had-e-muddat ka khayal rakhein.",
      },
      {
        en: "Consider whether the amount justifies formal litigation versus a negotiated settlement.",
        ur: "غور کریں کہ آیا رقم باضابطہ مقدمہ بازی کا جواز رکھتی ہے یا باہمی سمجھوتہ زیادہ بہتر رہے گا۔",
        roman: "Ghor karein keh aya raqam bazabta muqadma bazi ka jawaz rakhti hai ya bahmi samjhota zyada behtar rahega.",
      },
    ],
    evidenceToPreserve: [
      {
        en: "The loan agreement, invoice, receipt, or any written acknowledgment of the debt.",
        ur: "قرض کا معاہدہ، انوائس، رسید، یا قرض کے اعتراف کی کوئی تحریر۔",
        roman: "Qarz ka muahida, invoice, receipt, ya qarz ke aitraf ki koi tehreer.",
      },
      {
        en: "Bank transfer records, cheques, or payment proof showing money changed hands.",
        ur: "بینک ٹرانسفر ریکارڈ، چیک، یا ادائیگی کا ثبوت جو رقم کی منتقلی ظاہر کرے۔",
        roman: "Bank transfer record, cheque, ya adaigi ka saboot jo raqam ki muntaqli zahir kare.",
      },
      {
        en: "Any WhatsApp/SMS/email messages acknowledging the debt or promising repayment.",
        ur: "کوئی بھی واٹس ایپ/ایس ایم ایس/ای میل پیغام جس میں قرض تسلیم کیا گیا ہو یا واپسی کا وعدہ کیا گیا ہو۔",
        roman: "Koi bhi WhatsApp/SMS/email paigham jis mein qarz tasleem kiya gaya ho ya wapsi ka waada kiya gaya ho.",
      },
      {
        en: "Proof of dispatch of your legal notice once sent.",
        ur: "قانونی نوٹس بھیجنے کے بعد اس کا ثبوت محفوظ رکھیں۔",
        roman: "Legal notice bhejne ke baad iska saboot mehfooz rakhein.",
      },
    ],
    whenToContactLawyer: {
      en: "Contact an advocate before filing any suit — the correct procedure (summary vs. regular suit) and limitation period materially affect your chances of recovery.",
      ur: "کوئی بھی مقدمہ دائر کرنے سے پہلے وکیل سے رابطہ کریں — صحیح طریقہ کار (سمری بمقابلہ عام مقدمہ) اور حدِ مدت آپ کے وصولی کے امکانات پر نمایاں اثر ڈالتے ہیں۔",
      roman: "Koi bhi muqadma dair karne se pehle wakeel se rabta karein — sahi tareeqa-e-kaar (summary bamuqabla aam muqadma) aur had-e-muddat aap ke wasooli ke imkanaat par numaya asar dalte hain.",
    },
  },

  succession: {
    whatMayBeHappening: {
      en: "Whether this needs a simple NADRA process or a civil court case depends on whether all heirs are available and whether anything about the inheritance is disputed.",
      ur: "کیا اس معاملے کے لیے صرف نادرا کا سادہ عمل کافی ہے یا عدالتی مقدمہ درکار ہے، یہ اس بات پر منحصر ہے کہ تمام ورثاء دستیاب ہیں اور کیا وراثت میں کوئی تنازع ہے۔",
      roman: "Kya is mamle ke liye sirf NADRA ka saada amal kafi hai ya adalati muqadma darkar hai, yeh is baat par depend karta hai keh tamam warasa dastyab hain aur kya wirasat mein koi tanaza hai.",
    },
    whatYouCanDoNow: [
      {
        en: "Gather the documents in the checklist below before visiting NADRA or a lawyer.",
        ur: "نادرا یا وکیل کے پاس جانے سے پہلے نیچے دی گئی چیک لسٹ کے مطابق دستاویزات جمع کریں۔",
        roman: "NADRA ya wakeel ke pass jane se pehle neeche di gayi checklist ke mutabiq dastawezat jama karein.",
      },
      {
        en: "If all heirs are alive, biometrically available, and nothing is disputed, the NADRA Succession Facilitation Unit can usually issue a succession certificate.",
        ur: "اگر تمام ورثاء زندہ، بائیومیٹرک کے لیے دستیاب ہوں، اور کوئی تنازع نہ ہو تو نادرا سکسیشن فسیلیٹیشن یونٹ عموماً وراثتی سرٹیفکیٹ جاری کر سکتا ہے۔",
        roman: "Agar tamam warasa zinda, biometric ke liye dastyab hon, aur koi tanaza na ho to NADRA Succession Facilitation Unit umooman wirasati certificate jari kar sakta hai.",
      },
      {
        en: "If a title is disputed or a minor heir is unrepresented, a civil court partition suit will likely be needed.",
        ur: "اگر ملکیت متنازع ہو یا کوئی نابالغ وارث بلا نمائندگی ہو تو غالباً عدالتی تقسیم کا مقدمہ درکار ہوگا۔",
        roman: "Agar milkiyat mutanaza ho ya koi nabaligh waris bila numaindagi ho to ghaliban adalati taqseem ka muqadma darkar hoga.",
      },
      {
        en: "Avoid transferring or selling any asset until the heirs' shares are formally established.",
        ur: "جب تک ورثاء کے حصے باضابطہ طور پر طے نہ ہوں، کسی اثاثے کی منتقلی یا فروخت سے گریز کریں۔",
        roman: "Jab tak warasa ke hissay bazabta tor par tay na hon, kisi asasay ki muntaqli ya farokht se gurez karein.",
      },
    ],
    evidenceToPreserve: [
      {
        en: "Death certificate of the deceased.",
        ur: "متوفی کا سرٹیفکیٹ برائے وفات۔",
        roman: "Mutawaffi ka death certificate.",
      },
      {
        en: "CNICs of all legal heirs and the Family Registration Certificate (FRC).",
        ur: "تمام قانونی ورثاء کے شناختی کارڈ اور فیملی رجسٹریشن سرٹیفکیٹ (ایف آر سی)۔",
        roman: "Tamam qanooni warasa ke CNIC aur Family Registration Certificate (FRC).",
      },
      {
        en: "Property, bank, or vehicle documents in the deceased's name.",
        ur: "متوفی کے نام پر جائیداد، بینک، یا گاڑی کی دستاویزات۔",
        roman: "Mutawaffi ke naam par jaidad, bank, ya gaari ki dastawezat.",
      },
      {
        en: "Any will or prior family settlement, if one exists.",
        ur: "اگر کوئی وصیت نامہ یا پہلے سے خاندانی تصفیہ موجود ہو تو اسے محفوظ رکھیں۔",
        roman: "Agar koi wasiyat nama ya pehle se khandani tasfiya mojood ho to usay mehfooz rakhein.",
      },
    ],
    whenToContactLawyer: {
      en: "Contact an advocate as soon as a title dispute, missing/deceased heir, or minor heir without a guardian is involved — NADRA alone cannot resolve these.",
      ur: "جیسے ہی ملکیت کا تنازع، لاپتہ/فوت شدہ وارث، یا بلا سرپرست نابالغ وارث کا معاملہ ہو، وکیل سے رابطہ کریں — نادرا اکیلے یہ حل نہیں کر سکتا۔",
      roman: "Jaise hi milkiyat ka tanaza, lapata/foot shuda waris, ya bila sarparast nabaligh waris ka mamla ho, wakeel se rabta karein — NADRA akele yeh hal nahi kar sakta.",
    },
  },

  "legal-notice": {
    whatMayBeHappening: {
      en: "A legal notice is a formal, on-record warning that puts the other side on notice before you go to court — it is often required, and frequently resolves matters on its own.",
      ur: "قانونی نوٹس ایک باضابطہ، ریکارڈ شدہ وارننگ ہے جو عدالت جانے سے پہلے دوسرے فریق کو آگاہ کرتی ہے — یہ اکثر ضروری ہوتی ہے اور اکثر معاملہ خود ہی حل کر دیتی ہے۔",
      roman: "Legal notice aik bazabta, record shuda warning hai jo adalat jane se pehle dusray fareeq ko agah karti hai — yeh aksar zaroori hoti hai aur aksar mamla khud hi hal kar deti hai.",
    },
    whatYouCanDoNow: [
      {
        en: "Clearly state what happened, what you are demanding, and a reasonable deadline (commonly 14-30 days).",
        ur: "واضح طور پر بیان کریں کہ کیا ہوا، آپ کیا مطالبہ کر رہے ہیں، اور ایک مناسب ڈیڈ لائن (عموماً 14 سے 30 دن) دیں۔",
        roman: "Wazeh tor par bayan karein keh kya hua, aap kya mutaliba kar rahay hain, aur aik munasib deadline (umooman 14 se 30 din) dein.",
      },
      {
        en: "Send it by registered post with acknowledgement due (AD), or courier, and keep proof of dispatch.",
        ur: "اسے رجسٹرڈ ڈاک بمعہ ایکناؤلج منٹ ڈیو (اے ڈی) یا کورئیر کے ذریعے بھیجیں اور ارسال کا ثبوت محفوظ رکھیں۔",
        roman: "Isay registered post ba-maa acknowledgement due (AD) ya courier ke zariye bhejein aur irsaal ka saboot mehfooz rakhein.",
      },
      {
        en: "Keep a copy of the notice and the delivery proof for any later court proceeding.",
        ur: "بعد میں کسی عدالتی کارروائی کے لیے نوٹس اور ڈلیوری کے ثبوت کی کاپی محفوظ رکھیں۔",
        roman: "Baad mein kisi adalati karwai ke liye notice aur delivery ke saboot ki copy mehfooz rakhein.",
      },
      {
        en: "If this is about a specific situation — a cheque, tenancy, or a debt — check whether a more specific wizard fits better.",
        ur: "اگر معاملہ کسی خاص صورتحال سے متعلق ہے — چیک، کرایہ داری، یا قرض — تو دیکھیں کہ کیا کوئی زیادہ مخصوص وزرڈ بہتر رہے گا۔",
        roman: "Agar mamla kisi khas soorat-e-haal se mutalliq hai — cheque, kirayadari, ya qarz — to dekhein keh kya koi zyada makhsoos wizard behtar rahega.",
      },
    ],
    evidenceToPreserve: [
      {
        en: "Any documents, messages, or contracts related to the dispute.",
        ur: "تنازع سے متعلق کوئی بھی دستاویزات، پیغامات، یا معاہدے۔",
        roman: "Tanaza se mutalliq koi bhi dastawezat, paighamat, ya muahiday.",
      },
      {
        en: "The recipient's correct name and address.",
        ur: "وصول کنندہ کا صحیح نام اور پتہ۔",
        roman: "Wasool kunanda ka sahi naam aur pata.",
      },
      {
        en: "Proof of dispatch (postal/courier receipt) once sent.",
        ur: "بھیجنے کے بعد ارسال کا ثبوت (ڈاک/کورئیر رسید)۔",
        roman: "Bhejne ke baad irsaal ka saboot (post/courier receipt).",
      },
      {
        en: "Any response you receive, and when it was received.",
        ur: "کوئی بھی جواب جو موصول ہو، اور اس کے موصول ہونے کا وقت۔",
        roman: "Koi bhi jawab jo mosool ho, aur uske mosool hone ka waqt.",
      },
    ],
    whenToContactLawyer: {
      en: "Contact an advocate if the notice period expires without a resolution, or if the matter is high-value, urgent, or already contested.",
      ur: "اگر نوٹس کی مدت بغیر حل کے ختم ہو جائے، یا معاملہ بڑی مالیت کا، فوری، یا پہلے سے متنازع ہو تو وکیل سے رابطہ کریں۔",
      roman: "Agar notice ki muddat baghair hal ke khatam ho jaye, ya mamla bari maliyat ka, fori, ya pehle se mutanaza ho to wakeel se rabta karein.",
    },
  },
};
