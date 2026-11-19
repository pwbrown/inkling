/**
 * Holiday words (core/seasons.ts): mixed into Scrawler pages in season, when
 * enough of them fit the player's keys. Lowercase, short and family-friendly;
 * a test checks each is in the bundled pack, so the word filter allows it.
 */
import type { SeasonId } from '../../core/seasons';

export const HOLIDAY_WORDS: Readonly<Record<SeasonId, readonly string[]>> = {
  thanksgiving: [
    'pie', 'corn', 'turkey', 'acorn', 'gravy', 'harvest', 'pumpkin', 'apple', 'cider', 'leaf',
    'leaves', 'autumn', 'fall', 'feast', 'family', 'thanks', 'thankful', 'grateful', 'squash', 'yam',
    'rolls', 'bread', 'butter', 'cranberry', 'pecan', 'maple', 'hay', 'barn', 'farm', 'wagon',
    'scarecrow', 'gourd', 'blanket', 'sweater', 'parade', 'napkin', 'plate', 'table', 'oven', 'recipe',
    'potato', 'carrot', 'beans', 'nap', 'football', 'pilgrim', 'stuffing', 'gather', 'share', 'orchard',
  ],
  christmas: [
    'snow', 'gift', 'sleigh', 'elf', 'cocoa', 'mitten', 'star', 'carol', 'bell', 'jingle',
    'merry', 'holly', 'tree', 'wreath', 'candle', 'cookie', 'sled', 'snowman', 'scarf', 'ribbon',
    'present', 'reindeer', 'north', 'pole', 'winter', 'frost', 'icicle', 'chimney', 'stocking', 'angel',
    'candy', 'cane', 'ginger', 'tinsel', 'ornament', 'lights', 'cheer', 'joy', 'jolly', 'elves',
    'toy', 'wrap', 'bow', 'pine', 'fireplace', 'snowflake', 'festive', 'sparkle', 'giving', 'mittens',
  ],
};
