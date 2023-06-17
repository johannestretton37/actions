import { summary } from '@actions/core';
import { SummaryTableRow } from '@actions/core/lib/summary';

const details = [
  {
    imageName: 'imagename:someTag',
    exists: true,
  },
  {
    imageName: 'anotherimagename:someNonExistingTag',
    exists: false,
  },
  {
    imageName: 'anotherimagename:someOtherNonExistingTag',
    exists: false,
  },
  {
    imageName: 'imagename:existingTag',
    exists: true,
  },
];

async function main() {
  summary.addHeading('Validate images', 2);
  summary.addTable([
    [
      { data: 'Image tag', header: true },
      { data: 'Exists', header: true },
    ],
    ...details.map((detail) => {
      const row: SummaryTableRow = [
        { data: `<code>${detail.imageName}</code>` },
        {
          data: detail.exists ? '✅' : '❌',
        },
      ];
      return row;
    }),
  ]);
  await summary.write();
}

main().then(() => console.log('done'));
