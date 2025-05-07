import { Context } from './context';
import { RevWrappers, Token } from './tokenizer';
import { matchEpiodes, SuffixSeasonOrEpisodesRes } from './episodes';

const AudioTerm = new Set([
  // Audio channels
  '2.0CH',
  '2CH',
  '5.1',
  '5.1CH',
  'DTS',
  'DTS-ES',
  'DTS5.1',
  'TRUEHD5.1',
  // Audio codec
  'AAC',
  'AACX2',
  'AAC×2',
  'AACX3',
  'AAC×3',
  'AACX4',
  'AAC×4',
  'AC3',
  'EAC3',
  'E-AC-3',
  'FLAC',
  'FLACX2',
  'FLAC×2',
  'FLACX3',
  'FLAC×3',
  'FLACX4',
  'FLAC×4',
  'LOSSLESS',
  'MP3',
  'WAV',
  'OGG',
  'VORBIS',
  // Audio language
  'DUALAUDIO',
  'DUAL AUDIO'
]);

const VideoTerm = new Set([
  // Frame rate
  '23.976FPS',
  '24FPS',
  '29.97FPS',
  '30FPS',
  '60FPS',
  '120FPS',
  // Video codec
  '8BIT',
  '8-BIT',
  '10BIT',
  '10BITS',
  '10-BIT',
  '10-BITS',
  'HI10',
  'HI10P',
  'HI444',
  'HI444P',
  'HI444PP',
  'H264',
  'H265',
  'H.264',
  'H.265',
  'X264',
  'X265',
  'X.264',
  'AVC',
  'HEVC',
  'HEVC2',
  'HEVC-10BIT',
  'HEVC_OPUS',
  'DIVX',
  'DIVX5',
  'DIVX6',
  'XVID',
  // Video format
  'AVI',
  'RMVB',
  'WMV',
  'WMV3',
  'WMV9',
  // Video quality
  'HDR',
  'HQ',
  'LQ',
  // Video resolution
  'HD',
  'SD'
]);

const VideoResolution = new Set([
  '480P',
  '720P',
  '1080P',
  '2160P',
  'AI2160p',
  '1280X720',
  '1280×720',
  '1920X816',
  '1920×816',
  '1920X1080',
  '1920×1080',
  '2K',
  '4K'
]);

const Source = new Set([
  'BD',
  'BDRIP',
  'BLURAY',
  'BLU-RAY',
  'BDREMUX',
  'UHDBDRIP',
  'DVD',
  'DVD5',
  'DVD9',
  'DVD-R2J',
  'DVDRIP',
  'DVD-RIP',
  'R2DVD',
  'R2J',
  'R2JDVD',
  'R2JDVDRIP',
  'HDTV',
  'HDTVRIP',
  'TVRIP',
  'TV-RIP',
  'WEB',
  'WEBCAST',
  'WEBDL',
  'WEB-DL',
  'WEBRIP',
  'WEB-RIP',
  'WEB-MKV'
]);

const Platfrom = new Set(['Baha', 'Bilibili', 'B-Global', 'ABEMA', 'CR', 'ViuTV', 'AMZN', 'ADN']);

const Type = new Set([
  'GEKIJOUBAN',
  'MOVIE',
  'OAD',
  'OAV',
  'ONA',
  'OVA',
  'SPECIAL',
  'SPECIALS',
  'TV',
  '特别篇',
  '特別篇',
  '特別編',
  '特别话',
  '特別话',
  '特別話',
  '番外篇',
  '番外編',
  '剧场版',
  '劇場版',
  //
  'SP',
  //
  'ED',
  'ENDING',
  'NCED',
  'NCOP',
  'OP',
  'OPENING',
  'PREVIEW',
  'PV'
]);

const Languages = new Set([
  'CN',
  'CHS',
  'CHT',
  'YUE',
  'JP',
  '简体',
  '国语中字',
  '繁體',
  '中日双语',
  '简日双语',
  '繁日雙語',
  'HOY粵語'
]);

const Subtitles = new Set([
  'ASS',
  'GB',
  'BIG5',
  'DUB',
  'DUBBED',
  'HARDSUB',
  'HARDSUBS',
  'RAW',
  'SOFTSUB',
  'SOFTSUBS',
  'SUB',
  'SUBBED',
  'SUBTITLED',
  'SRT'
]);

const LanguagePrefixes = [
  '简体',
  '繁體',
  '简日',
  '繁日',
  '简繁日双语',
  '简繁日',
  '简繁',
  '繁简日',
  '简繁日语',
  '简日双语'
];

const SubtitlesSufixes = new Set(['内嵌', '內嵌', '内封', '内封字幕', '外挂', '外掛']);

const PlatformLanguage = new Map([['ViuTV粵語', ['ViuTV', '粵語']]]);

const LanguageSubtitles = new Map([
  ['简体字幕', ['简体', undefined]],
  ['繁體字幕', ['繁體', undefined]],
  ['简日双语字幕', ['简日双语', undefined]],
  ['TVB粵語', ['粵語', undefined]],
  ['代理商粵語', ['粵語', undefined]],
  ['粵日雙語+內封繁體中文字幕', ['繁體中文', '內封字幕']],
  ['粵語+無對白字幕', [undefined, '無對白字幕']]
]);

const Extension = new Set([
  '3GP',
  'AVI',
  'DIVX',
  'FLV',
  'M2TS',
  'MKV',
  'MOV',
  'MP4',
  'MPG',
  'OGM',
  'RM',
  'RMVB',
  'TS',
  'WEBM',
  'WMV'
]);

const Tags = new Set(['国漫', '先行版', '先行版本', '正式版', '正式版本', 'Ani-One']);

// Prefix
const SearchPrefix = ['检索：', '检索用：'];
const HiringPrefix = ['招募', '字幕社招人'];
const OtherPrefix = ['▶'];

function matchSingleTag(ctx: Context, text: string) {
  const upper = text.toUpperCase();
  // Match keywords
  if (AudioTerm.has(upper)) {
    ctx.update3('file', 'audio', 'term', text);
    return true;
  }
  if (VideoTerm.has(upper)) {
    ctx.update3('file', 'video', 'term', text);
    return true;
  }
  if (VideoResolution.has(upper)) {
    ctx.update3('file', 'video', 'resolution', text);
    return true;
  }
  if (Source.has(upper)) {
    ctx.update('source', text);
    return true;
  }
  if (Platfrom.has(text)) {
    ctx.update('platform', text);
    return true;
  }
  if (Type.has(upper)) {
    ctx.update('type', text);
    return true;
  }
  if (Extension.has(upper)) {
    ctx.update2('file', 'extension', text);
    return true;
  }
  if (Tags.has(text)) {
    ctx.tags.push(text);
    return true;
  }

  // Match language and subtitles
  {
    if (Languages.has(upper)) {
      ctx.update('language', text);
      return true;
    }
    if (Subtitles.has(upper)) {
      ctx.update('subtitles', text);
      return true;
    }
    // Combine language and subtitles
    const combined = LanguageSubtitles.get(text);
    if (combined) {
      ctx.update('language', combined[0]);
      ctx.update('subtitles', combined[1]);
      return true;
    }
    const combined2 = PlatformLanguage.get(text);
    if (combined2) {
      ctx.update('platform', combined2[0]);
      ctx.update('language', combined2[1]);
      return true;
    }

    // Auto combined
    for (const prefix of LanguagePrefixes) {
      if (text.startsWith(prefix)) {
        const language = prefix;
        const subtitles = text.slice(prefix.length);
        if (SubtitlesSufixes.has(subtitles)) {
          ctx.update('language', language);
          ctx.update('subtitles', subtitles);
          return true;
        }
      }
    }
  }

  // Match regex
  {
    {
      // 2024年10月番
      const match = /^(\d\d\d\d)年(\d\d?)月新?番$/.exec(text);
      if (match) {
        const year = +match[1];
        const month = +match[2];
        if (1949 <= year && year <= 2099) {
          ctx.update('year', year);
        }
        if (1 <= month && month <= 12) {
          ctx.update('month', month);
        }
        return true;
      }
    }
    {
      // ★10月新番
      const match = /^★?(\d\d?)月新?番★?$/.exec(text);
      if (match) {
        const month = +match[1];
        if (1 <= month && month <= 12) {
          ctx.update('month', month);
        }
        return true;
      }
    }
    {
      // [2024.12.15]
      const match = /^(\d\d\d\d)\.(\d?\d)\.(\d?\d)$/.exec(text);
      if (match) {
        const year = +match[1];
        const month = +match[2];
        if (1949 <= year && year <= 2099) {
          ctx.update('year', year);
        }
        if (1 <= month && month <= 12) {
          ctx.update('month', month);
        }
        return true;
      }
    }
    {
      // [2024SP]
      const match = /^(\d\d\d\d)(SP)$/.exec(text);
      if (match) {
        const year = +match[1];
        const type = match[2];
        if (1949 <= year && year <= 2099) {
          ctx.update('year', year);
        }
        ctx.update('type', type);
        return true;
      }
    }
    {
      // v2
      const match = /^[vV](\d+)$/.exec(text);
      if (match) {
        const version = +match[1];
        ctx.update('version', version);
        return true;
      }
    }
  }

  // Match prefix
  {
    for (const prefix of SearchPrefix) {
      if (text.startsWith(prefix)) {
        const title = text.slice(prefix.length).trim();
        ctx.tags.push(title);
        return true;
      }
    }
    for (const prefix of HiringPrefix) {
      if (text.startsWith(prefix)) {
        return true;
      }
    }
    for (const prefix of OtherPrefix) {
      if (text.startsWith(prefix)) {
        ctx.tags.push(text);
        return true;
      }
    }
  }

  return false;
}

const TagSeperators = [' ', '_'];
function matchMultipleTags(ctx: Context, text: string) {
  for (const sep of TagSeperators) {
    const parts = text.split(sep);
    if (parts.length <= 1) continue;
    let matched = true;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (!matchSingleTag(ctx, part)) {
        matched = false;
      }
    }
    if (matched) {
      return true;
    }
  }
  return false;
}

function parseTag(ctx: Context, cursor: number) {
  const token = ctx.tokens[cursor];
  if (token.isWrapped) {
    const text = token.text;
    if (matchSingleTag(ctx, text)) {
      return true;
    }
    if (matchEpiodes(ctx, text)) {
      return true;
    }
    if (matchMultipleTags(ctx, text)) {
      return true;
    }
  }
  return false;
}

export function parseRightTags(ctx: Context) {
  while (ctx.left < ctx.right) {
    if (parseTag(ctx, ctx.right)) {
      ctx.right -= 1;
    } else {
      // Unknown tags
      if (ctx.left + 2 < ctx.right && ctx.right >= ctx.tokens.length - 1) {
        ctx.tags.push(ctx.tokens[ctx.right].text);
        ctx.right -= 1;
      } else {
        break;
      }
    }
  }

  {
    // Handle space splitted tags: 【極影字幕社】★10月新番 在地下城尋求邂逅是否搞錯了什麼 第五季 豐饒的女神篇 第06話 BIG5 1080P MP4（字幕社招人內詳）
    const token = ctx.tokens[ctx.right];
    const text = token.text;
    const sepearators = [' ', '★'];
    for (const sep of sepearators) {
      const parts = text.split(sep);
      if (parts.length > 1) {
        let changed = 0;
        while (parts.length > 1) {
          const part = parts[parts.length - 1];
          // Skip single number
          if (/^\d+$/.test(part)) {
            break;
          }
          if (
            matchSingleTag(ctx, part) ||
            matchEpiodes(ctx, part) ||
            matchMultipleTags(ctx, part)
          ) {
            changed++;
            parts.pop();
          } else {
            break;
          }
        }
        if (changed > 1) {
          const trimmed = parts.join(sep);
          ctx.tokens[ctx.right] = new Token(trimmed, token.left, token.right);
        }
        if (changed > 0) {
          break;
        }
      }
    }
  }
}

export function parseLeftTags(ctx: Context) {
  while (ctx.left < ctx.right) {
    if (parseTag(ctx, ctx.left)) {
      ctx.left += 1;
    } else {
      break;
    }
  }

  // Match prefix
  {
    const token = ctx.tokens[ctx.left];
    const text = token.text;
    // 【极影字幕社】 ★10月新番
    const match = /^★?(\d\d?)月新?番★?/.exec(text);
    if (match) {
      const matched = match[0];
      const month = +match[1];
      ctx.update('month', month);
      ctx.tokens[ctx.left] = token.slice(matched.length);
      if (ctx.tokens[ctx.left].text.length === 0) {
        ctx.left += 1;
      }
    }
  }
  {
    const token = ctx.tokens[ctx.left];
    const text = token.text;
    const match = /^★?(剧场版|劇場版)★?/.exec(text);
    if (match) {
      const matched = match[0];
      const type = match[1];
      ctx.update('type', type);
      ctx.tokens[ctx.left] = token.slice(matched.length);
      if (ctx.tokens[ctx.left].text.length === 0) {
        ctx.left += 1;
      }
    }
  }
}

export function parseSuffixSeasonOrEpisodes(ctx: Context, text: string) {
  while (true) {
    let found = false;
    // Ends with: [45]
    if (RevWrappers.has(text[text.length - 1])) {
      const leftWrapper = RevWrappers.get(text[text.length - 1])!;
      const leftIdx = text.lastIndexOf(leftWrapper);
      if (leftIdx !== -1) {
        const maybe = text.slice(leftIdx + 1, text.length - 1);
        if (maybe.length > 0) {
          if (matchSingleTag(ctx, maybe) || (!ctx.hasEpisode && matchEpiodes(ctx, maybe))) {
            text = text.slice(0, text.length - maybe.length - 2).trimEnd();
            found = true;
          }
        }
      }
    }

    //
    for (const [re, fn] of SuffixSeasonOrEpisodesRes) {
      const res = re.exec(text);
      if (res && fn(res, ctx)) {
        text = text.slice(0, text.length - res[0].length).trimEnd();
        found = true;
        break;
      }
    }
    if (!found) break;
  }

  return text;
}
