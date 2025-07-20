import fs from 'fs/promises';
import path from 'path';

const curriculumDir = './src/data/curriculum';
const outputFile = './seed.sql';

async function generateSeed() {
  try {
    const files = await fs.readdir(curriculumDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    let sqlStatements = '';

    for (const file of jsonFiles) {
      const filePath = path.join(curriculumDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content.trim());

      const subject = data.subject;

      for (const gradeKey in data.grades) {
        const gradeNum = parseInt(gradeKey.replace(/kelas/i, '').trim());
        const gradeData = data.grades[gradeKey];

        for (const semesterKey in gradeData) {
          const semesterNum = parseInt(semesterKey.replace(/semester/i, '').trim());
          const semesterData = gradeData[semesterKey];

          if (Array.isArray(semesterData)) {
            // Handle structure like in matematika.json: [{chapter, topics}]
            for (const item of semesterData) {
              const chapter = item.chapter;
              const topics = item.topics;
              if (Array.isArray(topics)) {
                const topicsArray = `{${topics.map(t => `"${t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
                sqlStatements += `
INSERT INTO public.curriculum (subject, grade, semester, chapter, topics)
VALUES ('${subject.replace(/'/g, "''")}', ${gradeNum}, ${semesterNum}, '${chapter.replace(/'/g, "''")}', '${topicsArray}');
`;
              } else {
                console.warn(`Topics for ${subject} - ${gradeKey} - ${semesterKey} - ${chapter} is not an array. Skipping.`);
              }
            }
          } else {
            // Handle structure like in ipas.json: { chapter: [topics] }
            for (const chapter in semesterData) {
              const topics = semesterData[chapter];
              if (Array.isArray(topics)) {
                const topicsArray = `{${topics.map(t => `"${t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
                sqlStatements += `
INSERT INTO public.curriculum (subject, grade, semester, chapter, topics)
VALUES ('${subject.replace(/'/g, "''")}', ${gradeNum}, ${semesterNum}, '${chapter.replace(/'/g, "''")}', '${topicsArray}');
`;
              } else {
                 console.warn(`Topics for ${subject} - ${gradeKey} - ${semesterKey} - ${chapter} is not an array. Skipping.`);
              }
            }
          }
        }
      }
    }

    await fs.writeFile(outputFile, sqlStatements);
    console.log(`Successfully generated seed file at ${outputFile}`);
  } catch (error) {
    console.error('Error generating seed file:', error);
  }
}

generateSeed();
