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
      { data: 'Image exists', header: true },
      { data: 'Image tag', header: true },
    ],
    ...details.map((detail) => {
      const row: SummaryTableRow = [
        {
          data: detail.exists ? '✅' : '❌',
        },
        { data: `<code>${detail.imageName}</code>` },
      ];
      return row;
    }),
  ]);
  await summary.write();
}

main().then(() => console.log('done'));
