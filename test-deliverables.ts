const buildDeliverablesAndMethod = (text: string, title?: string) => {
  const input = text.toLowerCase();
  const deliverables: string[] = [];
  if (/\b(essay|paper|report)\b/.test(input)) deliverables.push('Written paper/essay');
  else if (/\bparagraph\b/.test(input)) deliverables.push('Written paragraph');
  if (/\b(slides?|slideshow|powerpoint|google slides)\b/.test(input)) deliverables.push('Presentation slides');
  if (/\b(poster|display board)\b/.test(input)) deliverables.push('Completed poster');
  if (/\b(worksheet|packet)\b/.test(input)) deliverables.push('Completed worksheet');
  if (/\b(video|recording)\b/.test(input)) deliverables.push('Video recording');

  if (deliverables.length === 0 && title) {
    const t = title.toLowerCase();
    if (/\b(essay|paper|report|paragraph|slides|poster|worksheet|packet|video|recording)\b/.test(t)) {
      deliverables.push(title); 
    }
  }

  let turnInMethod = 'Turn-in method not provided.';
  if (/\b(canvas|google classroom|blackboard|schoology|upload|submit online)\b/.test(input)) {
    turnInMethod = 'Online submission (LMS/Portal)';
  } else if (/\b(print|hand in|on paper|physical)\b/.test(input) || (input.includes('bring') && input.includes('class'))) {
    turnInMethod = 'In person (physical)';
  } else if (/\bemail\b/.test(input)) {
    turnInMethod = 'Email to teacher';
  }

  return { deliverables, turnInMethod };
};
console.log(buildDeliverablesAndMethod("Please bring the worksheet to class tomorrow"));
