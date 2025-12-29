import { run, bench, boxplot, summary } from 'mitata';
import { Snowflake } from '$src/snowflake';

boxplot(() => {
    summary(() => {
        bench('benchmark @timondev/snowflakes', () => {
            Snowflake.generate();
        }).gc('inner');
    })
});

await run();