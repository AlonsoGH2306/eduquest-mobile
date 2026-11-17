const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const randomSuffix = (length = 8) => {
  let suffix = '';
  for (let index = 0; index < length; index += 1) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return suffix;
};

export const generateJitsiLink = (title: string) => {
  const slug = slugify(title);
  return `https://meet.jit.si/EduQuest-${slug ? `${slug}-` : ''}${randomSuffix()}`;
};
