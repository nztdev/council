// The text of the "How Council works" guide (src/app/guide/page.tsx).
// Kept in one file so the wording can be edited - or translated - without
// touching any screen. To add a slide, add an entry here; the page picks it
// up automatically. `icon` must be one of the keys in ICONS in the page.
import { CIRCLE } from "@/lib/copy";

export type GuideIcon = "crown" | "circle" | "users" | "ask" | "answer";

export interface GuideSlide {
  id: string;
  icon: GuideIcon;
  title: string;
  /** one paragraph each */
  body: string[];
}

export const GUIDE_SLIDES: GuideSlide[] = [
  {
    id: "supreme",
    icon: "crown",
    title: "Your Supreme Council",
    body: [
      "Every account starts with one permanent council: the people whose judgement matters most to you, across everything.",
      "You ask the questions; the people you invite advise. You can rename it, but it's always there.",
    ],
  },
  {
    id: "circle",
    icon: "circle",
    title: `Your ${CIRCLE}`,
    body: [
      `Your ${CIRCLE} is the people you've chosen to connect with. Nobody can see you, or add you to a council, without you agreeing.`,
      `You connect by sending an invite link: when someone opens it, you're linked. You can remove someone from your ${CIRCLE} at any time.`,
    ],
  },
  {
    id: "councils",
    icon: "users",
    title: "Councils and roles",
    body: [
      "Create as many councils as you like, for different parts of your life. You invite people from your Circle, and they accept or decline.",
      "In each council its owner decides who can ask questions: only them, with everyone else as Advisors, or anyone in it, as Members. In councils you create you're the owner; in others you're an Advisor or a Member.",
    ],
  },
  {
    id: "asking",
    icon: "ask",
    title: "Asking a question",
    body: [
      "Post a question and choose how it closes: when you close it yourself, at a deadline, once everyone has answered, or whichever comes first.",
      "You never vote on your own question, so \"everyone\" means everyone else in the council.",
    ],
  },
  {
    id: "answering",
    icon: "answer",
    title: "Answering",
    body: [
      "Questions waiting for you appear in your Queue. Choose Yes, Maybe or No, and add a reason if you like. You see the results once you've answered.",
      "Everyone in a council can see its questions and each other's votes, so only invite people you're comfortable with.",
    ],
  },
];