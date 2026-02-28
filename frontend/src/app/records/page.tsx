import { recordApi } from "@/services/api/record";
import type { DailyStat, RecordSummaryStats } from "@/services/api/types";
import { cookies } from "next/headers";

type TrendPoint = {
  label: string;
  value: number;
};

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M55.5 4.5H28.5V67.5H55.5C60.471 67.5 64.5 63.372 64.5 58.281V13.719C64.5 8.628 60.471 4.5 55.5 4.5ZM57 26.667C57 28.5075 55.6575 30 54 30H39C37.3425 30 36 28.5075 36 26.667V18.333C36 16.4925 37.3425 15 39 15H54C55.6575 15 57 16.4925 57 18.333V26.667ZM16.5 4.5C11.529 4.5 7.5 8.628 7.5 13.719V58.2795C7.5 63.372 11.529 67.5 16.5 67.5H25.5V4.5H16.5ZM19.5 50.598H13.5C12.2565 50.598 11.25 49.566 11.25 48.2925C11.25 47.019 12.2565 45.987 13.5 45.987H19.5C20.7435 45.987 21.75 47.019 21.75 48.2925C21.75 49.566 20.7435 50.598 19.5 50.598ZM19.5 38.3055H13.5C12.2565 38.3055 11.25 37.2735 11.25 36C11.25 34.7265 12.2565 33.6945 13.5 33.6945H19.5C20.7435 33.6945 21.75 34.7265 21.75 36C21.75 37.2735 20.7435 38.3055 19.5 38.3055ZM19.5 26.0115H13.5C12.2565 26.0115 11.25 24.9795 11.25 23.706C11.25 22.4325 12.2565 21.4005 13.5 21.4005H19.5C20.7435 21.4005 21.75 22.4325 21.75 23.706C21.75 24.9795 20.7435 26.0115 19.5 26.0115Z"
        fill="#BDD2ED"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g clipPath="url(#clip0_84_747)">
        <path
          d="M3 35.5C2.99977 39.7679 3.84024 43.994 5.47341 47.9371C7.10659 51.8801 9.50048 55.4629 12.5184 58.4809C15.5363 61.4988 19.1192 63.8928 23.0624 65.5261C27.0056 67.1594 31.2319 68 35.5 68C39.7681 68 43.9944 67.1594 47.9376 65.5261C51.8808 63.8928 55.4637 61.4988 58.4816 58.4809C61.4995 55.4629 63.8934 51.8801 65.5266 47.9371C67.1598 43.994 68.0002 39.7679 68 35.5C68.0002 31.2321 67.1598 27.006 65.5266 23.0629C63.8934 19.1199 61.4995 15.5371 58.4816 12.5191C55.4637 9.50121 51.8808 7.10725 47.9376 5.47395C43.9944 3.84065 39.7681 3 35.5 3C31.2319 3 27.0056 3.84065 23.0624 5.47395C19.1192 7.10725 15.5363 9.50121 12.5184 12.5191C9.50048 15.5371 7.10659 19.1199 5.47341 23.0629C3.84024 27.006 2.99977 31.2321 3 35.5Z"
          fill="#D7E5F2"
        />
        <path
          d="M36.0069 72C30.0092 72.0012 24.1062 70.5038 18.8342 67.6439C13.5623 64.784 9.08835 60.6523 5.81892 55.624C2.54949 50.5957 0.588167 44.8303 0.113111 38.8514C-0.361945 32.8725 0.664327 26.8697 3.0987 21.3882C3.21118 21.1337 3.37275 20.9038 3.57416 20.7117C3.77556 20.5196 4.01286 20.3691 4.27247 20.2688C4.53208 20.1685 4.80892 20.1203 5.08715 20.1271C5.36539 20.1339 5.63956 20.1954 5.89399 20.3082C6.14856 20.4207 6.37846 20.5823 6.57054 20.7837C6.76262 20.9851 6.91312 21.2224 7.01342 21.482C7.11373 21.7416 7.16188 22.0185 7.15511 22.2967C7.14834 22.5749 7.0868 22.8491 6.97399 23.1035C5.1594 27.1601 4.22821 31.5561 4.24223 36C4.24387 42.6234 6.31591 49.0806 10.1685 54.4683C14.021 59.856 19.4613 63.9046 25.7284 66.0478C31.9954 68.1911 38.7757 68.3216 45.1206 66.4213C51.4655 64.521 57.0577 60.6848 61.1148 55.4494C65.172 50.2141 67.4911 43.8414 67.7478 37.223C68.0044 30.6046 66.1858 24.0715 62.5463 18.5377C58.9068 13.0038 53.6285 8.74608 47.4498 6.36007C41.2711 3.97407 34.5011 3.57916 28.0869 5.23059C27.8172 5.30011 27.5364 5.31582 27.2605 5.27682C26.9847 5.23783 26.7193 5.14488 26.4794 5.0033C25.9949 4.71736 25.6438 4.25067 25.5034 3.70588C25.4339 3.43613 25.4182 3.15533 25.4572 2.87951C25.4962 2.60368 25.5891 2.33824 25.7307 2.09834C25.8723 1.85844 26.0597 1.64877 26.2823 1.48131C26.5049 1.31385 26.7583 1.19188 27.0281 1.12235C29.9631 0.378204 32.9791 0.00120462 36.0069 0C45.5547 0 54.7114 3.79285 61.4628 10.5442C68.2141 17.2955 72.0069 26.4522 72.0069 36C72.0069 45.5478 68.2141 54.7045 61.4628 61.4558C54.7114 68.2072 45.5547 72 36.0069 72Z"
          fill="#BDD2ED"
        />
        <path
          d="M36.0069 17.2166C35.7288 17.2166 35.4535 17.1618 35.1965 17.0554C34.9396 16.9489 34.7062 16.793 34.5095 16.5963C34.3129 16.3997 34.1569 16.1662 34.0505 15.9093C33.944 15.6524 33.8893 15.377 33.8893 15.0989V11.7954C33.8893 11.2337 34.1124 10.6951 34.5095 10.298C34.9067 9.90084 35.4453 9.67773 36.0069 9.67773C36.5686 9.67773 37.1072 9.90084 37.5043 10.298C37.9015 10.6951 38.1246 11.2337 38.1246 11.7954V15.0989C38.1246 15.377 38.0698 15.6524 37.9634 15.9093C37.8569 16.1662 37.701 16.3997 37.5043 16.5963C37.3077 16.793 37.0742 16.9489 36.8173 17.0554C36.5604 17.1618 36.285 17.2166 36.0069 17.2166ZM15.1057 38.1177H11.8022C11.2406 38.1177 10.702 37.8946 10.3048 37.4975C9.90768 37.1003 9.68457 36.5617 9.68457 36.0001C9.68457 35.4384 9.90768 34.8998 10.3048 34.5027C10.702 34.1055 11.2406 33.8824 11.8022 33.8824H15.1057C15.6674 33.8824 16.206 34.1055 16.6031 34.5027C17.0003 34.8998 17.2234 35.4384 17.2234 36.0001C17.2234 36.5617 17.0003 37.1003 16.6031 37.4975C16.206 37.8946 15.6674 38.1177 15.1057 38.1177ZM36.0069 62.3224C35.7288 62.3224 35.4535 62.2677 35.1965 62.1612C34.9396 62.0548 34.7062 61.8988 34.5095 61.7022C34.3129 61.5055 34.1569 61.2721 34.0505 61.0152C33.944 60.7582 33.8893 60.4829 33.8893 60.2048V56.9013C33.8893 56.3396 34.1124 55.801 34.5095 55.4039C34.9067 55.0067 35.4453 54.7836 36.0069 54.7836C36.5686 54.7836 37.1072 55.0067 37.5043 55.4039C37.9015 55.801 38.1246 56.3396 38.1246 56.9013V60.2048C38.1246 60.4829 38.0698 60.7582 37.9634 61.0152C37.8569 61.2721 37.701 61.5055 37.5043 61.7022C37.3077 61.8988 37.0742 62.0548 36.8173 62.1612C36.5604 62.2677 36.285 62.3224 36.0069 62.3224ZM60.2116 38.1177H56.9081C56.3465 38.1177 55.8078 37.8946 55.4107 37.4975C55.0135 37.1003 54.7904 36.5617 54.7904 36.0001C54.7904 35.4384 55.0135 34.8998 55.4107 34.5027C55.8078 34.1055 56.3465 33.8824 56.9081 33.8824H60.2116C60.7733 33.8824 61.3119 34.1055 61.709 34.5027C62.1062 34.8998 62.3293 35.4384 62.3293 36.0001C62.3293 36.5617 62.1062 37.1003 61.709 37.4975C61.3119 37.8946 60.7733 38.1177 60.2116 38.1177ZM51.7834 47.0754C51.4139 47.0666 51.0515 46.9724 50.7246 46.8001L34.9693 37.8424C34.4871 37.5719 34.1299 37.1234 33.974 36.593L30.6704 25.1577C30.5488 24.6292 30.6345 24.0742 30.91 23.607C31.1854 23.1399 31.6296 22.7962 32.1509 22.6469C32.6723 22.4975 33.2311 22.5539 33.7121 22.8043C34.1931 23.0548 34.5597 23.4803 34.7363 23.993L37.8069 34.5813L52.821 43.0518C53.309 43.3277 53.6677 43.7857 53.8186 44.3255C53.9694 44.8654 53.9001 45.443 53.6257 45.9318C53.4502 46.2708 53.1863 46.556 52.862 46.7573C52.5377 46.9586 52.165 47.0685 51.7834 47.0754Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_84_747">
          <rect width="72" height="72" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function toISODate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthDay(isoDate: string) {
  const parts = isoDate.split("-");
  if (parts.length !== 3) {
    return isoDate;
  }
  const month = String(Number(parts[1]));
  const day = String(Number(parts[2]));
  return `${month}.${day}`;
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "0分钟";
  }
  if (minutes < 60) {
    return `${Math.round(minutes)}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${rest}分钟`;
}

function buildCandidates(bases: number[]) {
  const candidates: number[] = [];
  for (let exp = -2; exp <= 4; exp += 1) {
    const factor = Math.pow(10, exp);
    for (const base of bases) {
      candidates.push(base * factor);
    }
  }
  return candidates.filter((v) => v > 0).sort((a, b) => a - b);
}

function pickStep(target: number, candidates: number[]) {
  if (!Number.isFinite(target) || target <= 0) {
    return candidates[0] ?? 1;
  }
  for (const step of candidates) {
    if (step >= target) {
      return step;
    }
  }
  return candidates[candidates.length - 1] ?? 1;
}

function nextHigherStep(current: number, candidates: number[]) {
  for (const step of candidates) {
    if (step > current) {
      return step;
    }
  }
  return current;
}

function nextLowerStep(current: number, candidates: number[]) {
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    if (candidates[i] < current) {
      return candidates[i];
    }
  }
  return current;
}

function formatTick(value: number, unit: string, decimals: number) {
  const content =
    decimals === 0
      ? String(Math.round(value))
      : value.toFixed(decimals);
  return `${content}${unit}`;
}

function AreaChart({
  points,
  unit,
  title,
  gradientId,
  unitMode = "count",
}: {
  points: TrendPoint[];
  unit: string;
  title: string;
  gradientId: string;
  unitMode?: "duration" | "count";
}) {
  const width = 560;
  const height = 300;
  const paddingLeft = 56;
  const paddingRight = 20;
  const paddingTop = 32;
  const paddingBottom = 54;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxRaw = points.reduce((acc, p) => Math.max(acc, p.value), 0);
  const isDuration = unitMode === "duration";
  const shouldUseMinutes = isDuration && maxRaw < 1;
  const scale = shouldUseMinutes ? 60 : 1;
  const displayUnit = isDuration ? (shouldUseMinutes ? "min" : "h") : unit;
  const valueDecimals = isDuration ? (shouldUseMinutes ? 0 : 1) : 0;
  const candidates = buildCandidates(
    isDuration
      ? shouldUseMinutes
        ? [5, 10, 15, 30, 60]
        : [0.5, 1, 2, 5, 10]
      : [1, 2, 5, 10]
  );
  const scaledPoints = points.map((p) => ({
    ...p,
    value: p.value * scale,
  }));
  const scaledMax = maxRaw * scale;
  const buffer = scaledMax * 0.15;
  const paddedMax = Math.max(0, scaledMax + buffer);
  const desiredTicks = 5;
  let step = pickStep(paddedMax / (desiredTicks - 1), candidates);
  const axisMin = 0;
  let axisMax = Math.ceil(paddedMax / step) * step;
  let tickCount = Math.round((axisMax - axisMin) / step) + 1;
  for (let i = 0; i < 6; i += 1) {
    if (tickCount > 6) {
      step = nextHigherStep(step, candidates);
    } else if (tickCount < 4) {
      step = nextLowerStep(step, candidates);
    } else {
      break;
    }
    axisMax = Math.ceil(paddedMax / step) * step;
    tickCount = Math.round((axisMax - axisMin) / step) + 1;
  }
  if (axisMax <= 0) {
    axisMax = step;
    tickCount = Math.max(4, tickCount);
  }
  const safeRange = axisMax > 0 ? axisMax : 1;

  const n = points.length;
  const xAt = (index: number) => {
    if (n <= 1) {
      return paddingLeft + plotWidth / 2;
    }
    const spacing = plotWidth / (n - 1);
    return paddingLeft + index * spacing;
  };
  const yAt = (value: number) =>
    paddingTop +
    (1 - Math.min(Math.max((value - axisMin) / safeRange, 0), 1)) *
      plotHeight;

  const coords = scaledPoints.map((p, idx) => ({
    x: xAt(idx),
    y: yAt(p.value),
    label: p.label,
    value: p.value,
  }));

  const baselineY = paddingTop + plotHeight;
  const linePath =
    coords.length === 0
      ? ""
      : coords
          .map((c, idx) => `${idx === 0 ? "M" : "L"} ${c.x} ${c.y}`)
          .join(" ");
  const areaPath =
    coords.length === 0
      ? ""
      : `${linePath} L ${coords[coords.length - 1].x} ${baselineY} L ${
          coords[0].x
        } ${baselineY} Z`;

  const gridLines = Array.from({ length: tickCount }, (_, i) => {
    const ratio = tickCount === 1 ? 1 : i / (tickCount - 1);
    const y = paddingTop + ratio * plotHeight;
    const value = axisMax - ratio * safeRange;
    return { y, value };
  });

  return (
    <div className="flex w-full flex-col rounded-[4px] bg-white p-6 shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]">
      <div className="text-center text-sm font-medium text-[#202020]">
        {title}
      </div>
      <div className="mt-6 w-full overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#709EDD" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#709EDD" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridLines.map((g, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={g.y}
                x2={width - paddingRight}
                y2={g.y}
                stroke="#D7E5F2"
                strokeWidth="2"
              />
              <text
                x={paddingLeft - 10}
                y={g.y + 5}
                textAnchor="end"
                fontSize="16"
                letterSpacing="-0.48"
                fill="#202020"
              >
                {formatTick(g.value, displayUnit, valueDecimals)}
              </text>
            </g>
          ))}

          {areaPath ? (
            <path d={areaPath} fill={`url(#${gradientId})`} />
          ) : null}
          {linePath ? (
            <path d={linePath} fill="none" stroke="#709EDD" strokeWidth="2" />
          ) : null}

          {coords.map((c) => (
            <g key={c.label}>
              <circle cx={c.x} cy={c.y} r={8} fill="transparent">
                <title>{formatTick(c.value, displayUnit, valueDecimals)}</title>
              </circle>
              <text
                x={c.x}
                y={baselineY + 40}
                textAnchor="middle"
                fontSize="16"
                letterSpacing="-0.48"
                fill="#202020"
              >
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default async function RecordsPage() {
  const token = (await cookies()).get("token")?.value;
  let stats: DailyStat[] = [];
  let summary: RecordSummaryStats | null = null;

  const now = new Date();
  const to = toISODate(now);
  const from = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return toISODate(d);
  })();
  try {
    summary = await recordApi.getSummary(token);
    stats = await recordApi.listDailyStats(token, { from, to });
  } catch {
    stats = [];
    summary = null;
  }

  const safeSummary: RecordSummaryStats = summary ?? {
    date: to,
    todayWords: 0,
    todayMinutes: 0,
    totalMinutes: 0,
    totalWords: 0,
  };

  const durationPoints: TrendPoint[] = stats.map((s) => ({
    label: formatMonthDay(s.date),
    value: s.studyMinutes / 60,
  }));
  const wordPoints: TrendPoint[] = stats.map((s) => ({
    label: formatMonthDay(s.date),
    value: s.studyWords,
  }));

  return (
    <section className="min-h-[900px] w-full bg-[#F8F8F8]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
        <div className="rounded-[4px] bg-white px-7 py-6 shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]">
          <div className="ml-2 text-[20px] tracking-[-0.6px] text-[#202020]">
            专属于用户的训练记录
          </div>
          <div className="mx-auto mt-[25px] h-1 w-full max-w-[1184px] bg-[#D7E5F2]" />
          <div className="mt-8 flex w-full flex-col items-stretch gap-5 lg:flex-row lg:items-center lg:justify-center lg:gap-7 lg:px-3">
            <div className="mx-auto flex w-full max-w-[320px] items-center justify-between sm:max-w-[340px] lg:mx-0 lg:w-[200px] lg:min-w-[200px] lg:max-w-none">
              <BookIcon className="h-[56px] w-[56px] flex-none sm:h-[60px] sm:w-[60px]" />
              <div className="w-[120px] text-center text-[16px] leading-[24px] tracking-[-0.48px] text-[#202020] sm:w-[124px] sm:text-[17px] sm:leading-[25px] lg:w-[120px]">
                今日学习&复习
                <br />
                {safeSummary.todayWords}词
              </div>
            </div>
            <div className="hidden h-[41px] w-1 flex-none rounded-[7px] bg-[#D7E5F2] lg:block" />
            <div className="mx-auto flex w-full max-w-[320px] items-center justify-between sm:max-w-[340px] lg:mx-0 lg:w-[200px] lg:min-w-[200px] lg:max-w-none lg:items-start">
              <ClockIcon className="h-[56px] w-[56px] flex-none sm:h-[60px] sm:w-[60px]" />
              <div className="mt-1 w-[120px] text-center text-[16px] font-semibold leading-[24px] tracking-[-0.48px] text-[#202020] sm:w-[124px] sm:text-[17px] sm:leading-[25px] lg:mt-0 lg:w-[120px]">
                今日学习时长
                <br />
                {formatDuration(safeSummary.todayMinutes)}
              </div>
            </div>
            <div className="hidden h-[41px] w-1 flex-none rounded-[7px] bg-[#D7E5F2] lg:block" />
            <div className="mx-auto flex w-full max-w-[320px] items-center justify-between sm:max-w-[340px] lg:mx-0 lg:w-[200px] lg:min-w-[200px] lg:max-w-none lg:items-start">
              <ClockIcon className="h-[56px] w-[56px] flex-none sm:h-[60px] sm:w-[60px]" />
              <div className="mt-1 w-[120px] text-center text-[16px] font-semibold leading-[24px] tracking-[-0.48px] text-[#202020] sm:w-[124px] sm:text-[17px] sm:leading-[25px] lg:mt-0 lg:w-[120px]">
                总共学习时长
                <br />
                {formatDuration(safeSummary.totalMinutes)}
              </div>
            </div>
            <div className="hidden h-[41px] w-1 flex-none rounded-[7px] bg-[#D7E5F2] lg:block" />
            <div className="mx-auto flex w-full max-w-[320px] items-center justify-between sm:max-w-[340px] lg:mx-0 lg:w-[200px] lg:min-w-[200px] lg:max-w-none">
              <BookIcon className="h-[56px] w-[56px] flex-none sm:h-[60px] sm:w-[60px]" />
              <div className="w-[120px] text-center text-[16px] leading-[24px] tracking-[-0.48px] text-[#202020] sm:w-[124px] sm:text-[17px] sm:leading-[25px] lg:w-[120px]">
                总共学习数量
                <br />
                {safeSummary.totalWords}词
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AreaChart
            title="每日学习时长"
            unit="h"
            points={durationPoints}
            gradientId="records-duration-gradient"
            unitMode="duration"
          />
          <AreaChart
            title="每日学习&复习总数量"
            unit="词"
            points={wordPoints}
            gradientId="records-words-gradient"
          />
        </div>
      </div>
    </section>
  );
}
