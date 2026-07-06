import { l, type Topic } from '../model'

export const stoicism: Topic = {
  id: 'stoicism',
  title: 'Stoicism i vardagen',
  tradition: 'Stoicism',
  min: 4,
  intro:
    'En slav, en statsman och en kejsare kom fram till samma sak: det enda du verkligen äger är ditt eget omdöme.',
  essay: [
    [
      'Stoicismen föddes i Aten omkring 300 f.Kr men blev en livshållning för hela romarriket. Dess kärna är enkel att formulera och svår att leva: skilj mellan det som beror på dig och det som inte gör det. Dina omdömen, avsikter och handlingar är dina. Ditt rykte, din hälsa, andras beteende — det är det inte. ',
      l('Epiktetos', 'person', 'epiktetos'),
      ', som föddes som slav, byggde hela sin undervisning på denna enda distinktion.',
    ],
    [
      l('Marcus Aurelius', 'person', 'marcus-aurelius'),
      ' skrev sina ',
      l('Självbetraktelser', 'source', 'aurelius'),
      ' i fältläger vid Donau, aldrig avsedda för andras ögon. Där påminner han sig själv, morgon efter morgon, om att människorna han ska möta kommer att vara otacksamma och svekfulla — och att hans uppgift ändå är att arbeta med dem, som händerna arbetar med varandra. Filosofin är här inte teori utan övning.',
    ],
    [
      'Stoikerna övade sig också i att tänka på döden — inte av dysterhet, utan för att skärpa blicken för det som är nu. Här möter de både ',
      l('egyptiernas omsorg om döden', 'topic', 'egypten'),
      ' och ',
      l('Predikarens', 'topic', 'predikaren'),
      ' svalka: den som håller förgängligheten i minnet värderar dagen annorlunda.',
    ],
  ],
  context: [
    [
      'Stoan fick sitt namn efter Stoa poikile, den målade pelarhallen i Aten där Zenon från Kition började undervisa omkring 300 f.Kr. Skolan delade filosofin i tre delar — logik, fysik, etik — men det var etiken som gjorde den till romarrikets praktiska livsfilosofi.',
    ],
    [
      'Att traditionens tre stora romerska röster var en slav, en rådgivare och en kejsare — Epiktetos, Seneca och Marcus Aurelius — säger något om dess anspråk: omständigheterna avgör inte om ett liv kan levas väl.',
    ],
  ],
  sources: ['aurelius'],
  related: ['predikaren', 'egypten', 'sjalen'],
  people: ['epiktetos', 'marcus-aurelius'],
}
