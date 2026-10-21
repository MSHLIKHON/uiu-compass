import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Compass,
  ShieldCheck,
  WifiOff,
  Target,
  Wallet,
  GraduationCap,
} from "lucide-react";
import { useApp } from "../state/AppState";
import { Card, Badge } from "../components/ui";
export default function Home() {
  const { t, data } = useApp();
  return (
    <>
      <div className="landing-hero">
        <div>
          <Badge tone="blue">
            {t("MADE FOR THE JOURNEY AHEAD", "সামনের পথের সঙ্গী")}
          </Badge>
          <h1>
            {t("Your future.", "আপনার ভবিষ্যৎ।")}
            <br />
            <em>{t("A clearer direction.", "আরও পরিষ্কার পথ।")}</em>
          </h1>
          <p>
            {t(
              "From your next grade to your last semester. A thoughtful academic and financial navigator for UIU students.",
              "পরের গ্রেড থেকে শেষ সেমেস্টার। UIU শিক্ষার্থীদের পড়াশোনা ও খরচের পরিকল্পনার সঙ্গী।",
            )}
          </p>
          <div className="actions">
            <Link
              className="button"
              to={data.profile.ready ? "/dashboard" : "/setup"}
            >
              {t("Find my way forward", "আমার পথ খুঁজুন")}
              <ArrowUpRight size={18} />
            </Link>
            <Link className="secondary" to="/policies">
              {t("Explore our sources", "তথ্যের উৎস দেখুন")}
            </Link>
          </div>
          <div className="hero-perks">
            <span>
              <ShieldCheck size={16} />
              {t("Private by default", "তথ্য থাকে ব্যক্তিগত")}
            </span>
            <span>
              <WifiOff size={16} />
              {t("Works offline", "অফলাইনেও চলে")}
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="compass-core">
            <Compass size={145} strokeWidth={1} />
          </div>
          <div className="floating-label label-one">
            <span className="dot blue-dot" />A clearer plan
          </div>
          <div className="floating-label label-two">✦ Your next chapter</div>
          <span className="north-label">N</span>
        </div>
      </div>
      <div className="tool-grid home-tools">
        {[
          {
            icon: Target,
            title: t("Aim with confidence", "আত্মবিশ্বাসে লক্ষ্য ঠিক করুন"),
            body: t(
              "Turn your target CGPA into a practical plan.",
              "লক্ষ্য সিজিপিএর জন্য বাস্তবসম্মত পরিকল্পনা করুন.",
            ),
            to: "/target",
          },
          {
            icon: Compass,
            title: t("Make retakes count", "রিটেকের মূল্য বুঝুন"),
            body: t(
              "Compare the academic benefit and the cost.",
              "গ্রেডের সুবিধা ও খরচ তুলনা করুন।",
            ),
            to: "/retakes",
          },
          {
            icon: Wallet,
            title: t("Plan every taka", "প্রতি টাকার পরিকল্পনা"),
            body: t(
              "Understand tuition and eligible waivers.",
              "টিউশন ফি ও প্রযোজ্য ওয়েভার বুঝুন।",
            ),
            to: "/fees",
          },
          {
            icon: GraduationCap,
            title: t("See your path", "আপনার পথ দেখুন"),
            body: t(
              "Connect today’s courses to graduation.",
              "আজকের কোর্সকে গ্র্যাজুয়েশনের সঙ্গে মেলান।",
            ),
            to: "/graduation",
          },
        ].map((x) => (
          <Link className="tool-card" to={x.to} key={x.to}>
            <x.icon className="blue-text" size={26} />
            <h3>{x.title}</h3>
            <p>{x.body}</p>
            <ArrowUpRight size={18} />
          </Link>
        ))}
      </div>
      <Card className="home-principle">
        <Badge tone="green">
          {t("CLARITY OVER GUESSWORK", "অনুমানের বদলে স্বচ্ছতা")}
        </Badge>
        <h2>
          {t(
            "A good compass tells you what it knows.",
            "ভালো কম্পাস জানায় তার তথ্যের সীমা।",
          )}
        </h2>
        <p>
          {t(
            "Official sources. Clearly labeled assumptions. Your own information. We keep them distinct, so you can make decisions with context.",
            "অফিসিয়াল উৎস, স্পষ্ট অনুমান ও আপনার নিজের তথ্য আলাদা করে দেখাই, যেন বুঝে সিদ্ধান্ত নিতে পারেন।",
          )}
        </p>
      </Card>
    </>
  );
}
