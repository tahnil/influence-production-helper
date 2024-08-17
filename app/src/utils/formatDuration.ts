// utils/formatDuration.ts

export const formatDuration = (totalRuns: number, mAdalianHoursPerSR: string): string => {
    // Convert Adalian hours to real-world hours
    const realWorldHoursPerSR = parseFloat(mAdalianHoursPerSR) / 24;
    const totalRealWorldHours = totalRuns * realWorldHoursPerSR;

    // Define the fallback for durations longer than 365 days
    const daysInYear = 365;
    const hoursInDay = 24;
    const maxRealWorldHours = daysInYear * hoursInDay;

    if (totalRealWorldHours > maxRealWorldHours) {
        return '>&thinsp;1 year';
    } else if (totalRealWorldHours < 1) {
        const minutes = Math.floor(totalRealWorldHours * 60);
        const seconds = Math.floor((totalRealWorldHours * 3600) % 60);
        return `${minutes}&thinsp;m&ensp;${seconds}&thinsp;s`;
    } else if (totalRealWorldHours < hoursInDay) {
        const hours = Math.floor(totalRealWorldHours);
        const minutes = Math.floor((totalRealWorldHours % 1) * 60);
        return `${hours}&thinsp;h&ensp;${minutes}&thinsp;m`;
    } else {
        const days = Math.floor(totalRealWorldHours / 24);
        const hours = Math.floor(totalRealWorldHours % 24);
        return `${days}&thinsp;d&ensp;${hours}&thinsp;h`;
    }
};
