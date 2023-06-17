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
  summary.addRaw('## Validate images');
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
        { data: detail.imageName },
      ];
      return row;
    }),
  ]);
}

main().then(() => console.log('done'));
