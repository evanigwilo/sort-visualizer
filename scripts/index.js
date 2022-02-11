const root = document.querySelector(':root');
const navButton = document.querySelector("#navbar-collapse");
const generateStopButton = document.querySelector(".controls__generate button");
const sortButton = document.querySelector(".controls__sort");
const slider = document.querySelector(".controls__range__sortspeed input");
const input = document.querySelector('#count');
const controls = document.querySelector('main #controls');
const aside = document.querySelector('aside');
const asideSideinfo = document.querySelector('aside #sideinfo');
const generateOptions = document.querySelector('.controls__generate__options');
const sidebarTitle = document.querySelectorAll('aside dl dd');
const main = document.querySelector('main');
const mainCompare = document.querySelector('main #compare');
const mainsortBox = document.querySelector('main > .sortbox');
const algoTrackerDefaultTop = 'calc(var(--main_algorithm_padding) + var(--main_algorithm_height) * ';

const checkFrequency = 30;
const constDelay = 0.05;

const sortBoxes = [];
const sortBoxesContainer = [];
const sortBoxesNodes = [];
const sortBoxesNumbers = [];
const sortBoxesConstants = [];
const sortBoxesAlgoBoard = [];

const buttonState = {
    generateBox: 'Generate',
    stopSorting: 'Stop'
};
const sortState = {
    sortSelection: null,
    terminated: false, // Triggerd to stop sorting
    terminateMsg: 'Sort Terminated',
    sliderValue: -1, // Used to reset slider to original value when speed is fast/fastest
    firstTimerStop: false, // Triggerd to set time to first sorting method to complete
    get canHover() {
        return !window.matchMedia("(hover: none)").matches;
    }
};
// Make opacity 0.5 for any disabled element
const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        const target = mutation.target;
        if (target.disabled && !target.classList.contains('opacity-half')) {
            target.classList.add('opacity-half');
            if (target.classList.contains('controls__sort')) {
                sortBoxesConstants.forEach(({ sortInput: { parentElement } }) => {
                    parentElement.classList.add('opacity-half');
                    parentElement.style.pointerEvents = 'none';
                });
            }
        } else if (!target.disabled && target.classList.contains('opacity-half')) {
            target.classList.remove('opacity-half');
            if (target.classList.contains('controls__sort')) {
                sortBoxesConstants.forEach(({ sortInput: { parentElement } }) => {
                    parentElement.classList.remove('opacity-half');
                    parentElement.style.pointerEvents = '';
                });
            }
        }
    });
});
document.querySelectorAll('input, textarea, button, select, a').forEach(element => {
    observer.observe(element, { attributes: true, childList: true });
});
window.addEventListener('DOMContentLoaded', function (e) {
    console.log("DOMContentLoaded");
    updateSliderValues();
    document.querySelector("#copyright_date").textContent = (new Date()).getUTCFullYear() + '.';
});
slider.addEventListener('input', () => {
    updateSliderValues();
});
input.addEventListener('change', () => {
    // Limit slider value to its min and Max Value
    input.value = input.value || input.min;
    input.value = Math.min(input.value, input.max);
});
generateOptions.childNodes.forEach(element => {
    element.addEventListener('click', async () => {

        sortButton.disabled = true;

        sortBoxesConstants.forEach(c => c.sortWatch.reset());

        for (let i = 0; i < sortBoxes.length; i++) {
            sortBoxesContainer[i].style.filter = '';
            await generateBoxNodes(i, element.textContent);
        }

        globalAdjust();

        sortButton.disabled = false;
    });
});
mainCompare.addEventListener('click', () => {
    mainCompare.classList.toggle('compare--move');

    if (sortBoxes.length < 2) {
        const element = mainsortBox.cloneNode(true);
        main.appendChild(element);
        sortBoxes.push(element);
        const container = element.getElementsByClassName('sortbox__container')[0];
        container.textContent = '';
        sortBoxesContainer.push(container);
        sortBoxesNodes.push([]);
        sortBoxesNumbers.push([]);
        const sortInput = element.getElementsByTagName('Input')[0];
        inputDropDownEvents(sortInput);
        const sortTimer = element.getElementsByClassName('sortbox__timer')[0];
        sortBoxesConstants.push({
            sortInput: sortInput,
            sortWatch: new StopWatch(sortBoxesConstants.length, sortTimer, setTimeFirstSortToComplete),
            copyTemp: null,
            elemTemp: null,
            maxNum: 0,
            animationPlaying: false,
        });
        sortBoxesAlgoBoard.push({
            algoBoard: element.getElementsByClassName('algorithm')[0],
            algoTitle: element.getElementsByClassName('algorithm__title')[0],
            algoSteps: element.getElementsByClassName('algorithm__steps')[0],
            algoTracker: element.getElementsByClassName('algorithm__tracker')[0],
            moveToLineConstants: {
                prev: null,
                fontWeight: null,
                transform: null,
                topOnce: false,
            }
        });
    } else {
        main.removeChild(sortBoxes.pop());
        sortBoxesContainer.pop();
        sortBoxesNodes.pop();
        sortBoxesNumbers.pop();
        const popConst = sortBoxesConstants.pop();
        popConst.sortWatch.reset();
        sortBoxesAlgoBoard.pop();
    }
    root.style.setProperty('--main_sortbox_width', 100 / sortBoxes.length + '%');

    generateStopButton.click();
});
navButton.addEventListener('click', () => {
    if (sortState.sortSelection) {
        sortState.sortSelection.classList.remove('dl_dd--active');
        sortState.sortSelection.classList.remove('sort-selection');
        sortState.sortSelection = null;
        root.style.setProperty('--aside_expandwidth', '0px');
        root.style.setProperty('--aside_sidetitle_width', '160px');
    } else {
        root.style.setProperty('--aside_sidetitle_width', '0px');
        navButton.classList.toggle('navbar-collapse-expand');
        if (navButton.classList.contains('navbar-collapse-expand')) {
            root.style.setProperty('--aside_sidetitle_width', '160px');
        }

    }
});
sidebarTitle.forEach(currentSelection => {
    currentSelection.addEventListener('click', async (e) => {
        sortButton.disabled = true;
        sortState.terminated = true;

        sortBoxesContainer.forEach((_, index) => printAlgoToBoard(index, ''));

        asideSideinfo.classList.add('blur-filter');

        if (sortState.sortSelection) {
            sortState.sortSelection.classList.remove('dl_dd--active');
            sortState.sortSelection.classList.remove('sort-selection');
            root.style.setProperty('--aside_expandwidth', '0px');
            controls.style.overflowY = '';
            if (sortState.sortSelection == currentSelection) {
                sortState.sortSelection = null;
            } else {
                !sortState.canHover && currentSelection.classList.add('dl_dd--active');
                sortState.sortSelection = currentSelection;
                await new Promise(r => setTimeout(r, 200));
                showSortDescription(currentSelection);
            }
        } else {
            !sortState.canHover && currentSelection.classList.add('dl_dd--active');
            sortState.sortSelection = currentSelection;
            showSortDescription(currentSelection);
        }

        await new Promise(r => setTimeout(r, 150));
        asideSideinfo.classList.remove('blur-filter');

        generateStopButton.click();

    });
});
function showSortDescription(currentSelection) {
    currentSelection.classList.add('sort-selection');

    if (windowState.mediaSize == 'extraSmall') {
        root.style.setProperty('--aside_sidetitle_width', '0px');
    }
    let expandwidth = '250px';
    if ( //windowState.mediaSize == 'extraSmall' ||
        //windowState.mediaSize == 'landscape' ||
        windowState.mediaSize != 'large') {
        expandwidth = main.clientWidth + 'px';
    }
    root.style.setProperty('--aside_expandwidth', expandwidth);
    if (currentSelection.textContent == "Merge Sort") {
        printSortDescription(infoMergeSort);
    }
    else if (currentSelection.textContent == "Quick Sort") {
        printSortDescription(infoQuickSort);
    }
    else if (currentSelection.textContent == "Bubble Sort") {
        printSortDescription(infoBubbleSort);
    }
    else if (currentSelection.textContent == "Insertion Sort") {
        printSortDescription(infoInsertSort);
    }
    else if (currentSelection.textContent == "Heap Sort") {
        printSortDescription(infoHeapSort);
    }
    else if (currentSelection.textContent == "Selection Sort") {
        printSortDescription(infoSelectionSort);
    }
}
function inputDropDownEvents(input) {
    const dropIcon = input.nextElementSibling;
    const dropList = dropIcon.nextElementSibling;
    dropList.childNodes.forEach(element => {
        element.addEventListener('click', () => {
            input.value = element.textContent;
            input.parentElement.click();
            generateStopButton.click();
        });
    });
    input.parentElement.addEventListener('click', (e) => {
        if (e.srcElement.nodeName === 'LI') return;
        dropList.classList.toggle('sortbox__select__dropdown--expand');
        dropIcon.classList.toggle('sortbox__select__dropdown--rotate');
    });
}
function updateSliderValues() {
    const velocity = animationlimit.velocity;
    slider.nextElementSibling.textContent = velocity;
    sortBoxesConstants.forEach(c => {
        if (//generateStopButton.textContent == buttonState.generateBox &&
            (velocity == animationlimit.fast || velocity == animationlimit.fastest))
            c.sortWatch.element.classList.add('sortbox__timer--show');
        else {
            c.sortWatch.element.classList.remove('sortbox__timer--show');
        }
    });
    const newWidth = animationlimit.normalized * 100;
    controls.style.setProperty('--sliderwidth', Math.floor(newWidth) + '%');
}
function setTimeFirstSortToComplete(element) {
    if (!sortState.firstTimerStop) {
        sortState.firstTimerStop = true;
        element.textContent += ' ✓';
        element.style.fontWeight = 'bold';
        // element.style.setProperty('--sortbox__time_display', 'inherit')
    }
}
async function generateBoxNodes(index, method) {
    const constants = sortBoxesConstants[index];
    const container = sortBoxesContainer[index];

    // Print Algorithm Steps
    printAlgoToBoard(index, '');
    if (constants.sortInput.value == "Bubble Sort") {
        printAlgoToBoard(index, algoBubbleSort);
    } else if (constants.sortInput.value == "Insertion Sort") {
        printAlgoToBoard(index, algoInsertionSort);
    }
    else if (constants.sortInput.value == "Selection Sort") {
        printAlgoToBoard(index, algoSelectionSort);
    }
    else if (constants.sortInput.value == "Heap Sort") {
        printAlgoToBoard(index, algoBuildHeap);
    }
    else if (constants.sortInput.value == "Quick Sort") {
        printAlgoToBoard(index, algoQuickSort);
    }
    else if (constants.sortInput.value == "Merge Sort") {
        printAlgoToBoard(index, algoMergeSort);
    }

    constants.horiMul = 1;
    constants.verTop = Math.floor(container.clientHeight / 2) - 1;
    constants.boxWidth = Math.floor(container.clientWidth / Number(input.value));
    constants.totalBox = Math.floor(container.clientWidth / constants.boxWidth);
    container.style.setProperty('--rightvelocity', constants.boxWidth * constants.horiMul + 'px');
    container.style.setProperty('--leftvelocity', + constants.boxWidth * constants.horiMul * -1 + 'px');
    container.style.setProperty('--upvelocity', constants.verTop * -1 + 'px');
    container.style.setProperty('--downvelocity', constants.verTop + 'px');


    constants.maxNum = sortBoxesNodes[index].length = sortBoxesNumbers[index].length = 0;
    // console.log({ sortBoxesNodes: sortBoxesNodes[index].length, sortBoxesNodes1: sortBoxesNodes[index] })
    container.textContent = '';

    if (index > 0) {
        sortBoxesNumbers[0].forEach(value => {
            sortBoxesNumbers[index].push(value);
            constants.maxNum = Math.max(constants.maxNum, value);
        });
    } else {
        if (method == 'Random') {
            Array.from({ length: constants.totalBox }, (_, i) => i + 1)
                .map(a => ({ value: a, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .forEach(value => {
                    sortBoxesNumbers[index].push(value.value);
                    constants.maxNum = Math.max(constants.maxNum, value.value);
                });
        } else if (method == 'Sorted Ascending') {
            constants.maxNum = constants.totalBox;
            for (let i = 1; i <= constants.totalBox; i++) {
                sortBoxesNumbers[index].push(i);
            }
        } else if (method == 'Sorted Descending') {
            constants.maxNum = constants.totalBox;
            for (let i = constants.totalBox; i >= 1; i--) {
                sortBoxesNumbers[index].push(i);
            }
        }
    }

    // Temp Array for Merge Sort
    constants.copyTemp = Array(constants.totalBox).fill();
    constants.elemTemp = Array(constants.totalBox).fill();

    for (let i = 0; i < constants.totalBox; i++) {
        const value = sortBoxesNumbers[index][i];
        const newLi = document.createElement("li");
        const newContent = document.createElement("p");
        if (constants.boxWidth >= 20) {
            newContent.textContent = value;
        }
        if (constants.boxWidth < 40) {
            newContent.classList.add('sortbox__container--transform');
        }
        newLi.appendChild(newContent);
        newLi.style.height = 35 + (value * constants.verTop / constants.maxNum) + 'px';
        newLi.style.width = constants.boxWidth + 'px';
        newLi.style.left = i * constants.boxWidth + 'px';
        newLi.style.zIndex = 0;
        newLi.style.paddingBottom = '10px';
        newLi.classList.add('transition');

        newLi.addEventListener('animationstart', (e) => animationStart(e, newLi));
        newLi.addEventListener('animationend', (e) => animationEnd(e, newLi));
        newLi.addEventListener('transitionend', (e) => transitionEnd(e, newLi));

        container.appendChild(newLi);

        sortBoxesNodes[index].push(newLi);

        makeTransition(newLi, index, 'opacity', 0);

        //await new Promise(r => setTimeout(r, constDelay));
    }
}

generateStopButton.addEventListener('click', async () => {
    globalAdjust();

    sortBoxesContainer.forEach(c => c.style.filter = 'blur(1px)');

    if (generateStopButton.textContent == buttonState.generateBox) {
        sortButton.disabled = true;

        generateOptions.classList.add('controls__generate__options--transform');
    }
    else {
        sortState.sliderValue = -1;

        const velocity = animationlimit.velocity;
        if (animationlimit.fast || velocity == animationlimit.fastest) {
            sortState.sliderValue = slider.value;
            slider.value = animationlimit.velocityValue(animationlimit.normal);
            updateSliderValues();
        }

        sortState.terminated = true;
    }
});

sortButton.addEventListener('click', () => {
    globalAdjust();

    generateStopButton.textContent = buttonState.stopSorting;

    sortButton.disabled = true;

    sortState.firstTimerStop = false;

    sortState.terminated = false;

    const allSortMethod = [];

    const velocity = animationlimit.velocity;
    if (velocity == animationlimit.fast || velocity == animationlimit.fastest) {
        sortBoxesConstants.forEach(c => c.sortWatch.reset(true));
    }

    sortBoxes.forEach((_, i) => {
        if (sortBoxesConstants[i].sortInput.value == "Bubble Sort") {
            allSortMethod.push(bubbleSort(sortBoxesNumbers[i], i));
        }
        else if (sortBoxesConstants[i].sortInput.value == "Insertion Sort") {
            allSortMethod.push(insertionSort(sortBoxesNumbers[i], i));
        }
        else if (sortBoxesConstants[i].sortInput.value == "Selection Sort") {
            allSortMethod.push(selectionSort(sortBoxesNumbers[i], i));
        }
        else if (sortBoxesConstants[i].sortInput.value == "Heap Sort") {
            allSortMethod.push(buildHeap(sortBoxesNumbers[i], i));
        }
        else if (sortBoxesConstants[i].sortInput.value == "Quick Sort") {
            allSortMethod.push(quickSort(sortBoxesNumbers[i], 0, sortBoxesNumbers[i].length - 1, i));
        }
        else if (sortBoxesConstants[i].sortInput.value == "Merge Sort") {
            makeCopy(i);
            allSortMethod.push(mergeSort(sortBoxesNumbers[i], 0, sortBoxesNumbers[i].length - 1, i));
        }
    });

    Promise.all(allSortMethod)
        .catch((error) => {
            if (error.message == sortState.terminateMsg) {
                console.log(sortState.terminateMsg);
            }
            // else throw error;
        }).finally(() => {
            generateStopButton.textContent = buttonState.generateBox;

            sortBoxesConstants.forEach(c => c.sortWatch.stop());

            // Reset Algorithm Board
            sortBoxesAlgoBoard.forEach(aBoard => {
                const moveToLineConstants = aBoard.moveToLineConstants;

                if (moveToLineConstants.prev) {
                    moveToLineConstants.prev.style.fontWeight = moveToLineConstants.fontWeight;
                    moveToLineConstants.prev.style.transform = moveToLineConstants.transform;
                }
                aBoard.algoTracker.style.top = `${algoTrackerDefaultTop} ${-2})`;
                aBoard.algoBoard.scrollTop = 0;
            });

            if (sortState.terminated) {

                if (sortState.sliderValue >= 0) {
                    slider.value = sortState.sliderValue;
                    updateSliderValues();
                }

                if (windowState.mediaSize == 'extraSmall' && sortBoxes.length > 1) {
                    mainCompare.click();
                }

                generateStopButton.click();
            }
        });

});

const moveToLine = async (sortBoxIndex, line) => {
    if (windowState.mediaSize == 'extraSmall')
        return;

    const aBoard = sortBoxesAlgoBoard[sortBoxIndex];
    aBoard.algoTracker.style.transform = '';

    const moveToLineConstants = aBoard.moveToLineConstants;

    if (moveToLineConstants.prev) {
        moveToLineConstants.prev.style.fontWeight = moveToLineConstants.fontWeight;
        moveToLineConstants.prev.style.transform = moveToLineConstants.transform;
    }
    const velocity = animationlimit.velocity;
    if (velocity == animationlimit.fast || velocity == animationlimit.fastest) {
        if (!moveToLineConstants.topOnce) {
            moveToLineConstants.topOnce = true;
            aBoard.algoTracker.style.top = `${algoTrackerDefaultTop} ${-2})`;
            aBoard.algoBoard.scrollTop = 0;
        }
        return;
    }
    moveToLineConstants.topOnce = false;

    const currentLine = aBoard.algoSteps.children[line];
    if (!currentLine.style)
        currentLine.style = '';

    moveToLineConstants.prev = currentLine;
    moveToLineConstants.fontWeight = currentLine.style.fontWeight;
    currentLine.style.fontWeight = 550;
    currentLine.style.transform = 'scale(1.025)';
    aBoard.algoBoard.scrollTo({ top: currentLine.offsetTop, behavior: 'smooth' });
    // currentLine.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
    aBoard.algoTracker.style.top = `${algoTrackerDefaultTop} ${line + 1})`;
    aBoard.algoTracker.style.transform = 'scale(1.025)';

    await new Promise(r => setTimeout(r, animationlimit.normalizedInversed * 1000));

    if (sortState.terminated) {
        throw new Error(sortState.terminateMsg);
    }
};
const printAlgoToBoard = (sortBoxIndex, theAlgorithm) => {
    const aBoard = sortBoxesAlgoBoard[sortBoxIndex];
    aBoard.algoSteps.textContent = '';

    theAlgorithm.split(/\n/).forEach(line => {
        if (line.trim().length > 0) {
            const count = document.createElement("span");
            count.textContent = aBoard.algoSteps.children.length + 1 + '.';
            const newLi = document.createElement("p");
            newLi.textContent = line;
            let padding = 0;
            for (let S of line) {
                if (S == ' ') {
                    padding += 3;
                } else break;
            }
            newLi.style.paddingLeft = 3 + padding + "px";

            const parent = document.createElement("section");
            parent.appendChild(count);
            parent.appendChild(newLi);

            aBoard.algoSteps.appendChild(parent);
        }
    });
    aBoard.algoTracker.style.top = `${algoTrackerDefaultTop} ${0})`;
};
const printSortDescription = (sortInformation) => {
    asideSideinfo.textContent = '';
    const parent = document.createElement("section");
    sortInformation.description.split(/\n/).forEach(line => {
        let newLi;
        if (line.trim().length > 0) {
            newLi = document.createElement("p");
            newLi.textContent = line;
        } else {
            newLi = document.createElement("br");
        }
        parent.appendChild(newLi);
    });
    const table = document.createElement("table");
    table.innerHTML = `
    <tbody>
        <tr>
            <td><strong>Best-case</strong></td>
            <td>${sortInformation.complexity.bestCase}</td>
        </tr>
            <td><strong>Average-case</strong></td>
            <td>${sortInformation.complexity.averageCase}</td>
        </tr>
        <tr>
            <td><strong>Worst-case</strong></td>
            <td>${sortInformation.complexity.worstCase}</td>
        </tr>
            <td><strong>Space Complexity</strong></td>
            <td>${sortInformation.complexity.spaceCase}</td>
        </tr>
            <td><strong>Stable</strong></td>
            <td>${sortInformation.complexity.stable}</td>
        </tr>
    </tr>
    </tbody>
    `;
    asideSideinfo.appendChild(parent);
    asideSideinfo.appendChild(table);
    asideSideinfo.scrollTop = 0;
};

sortBoxes.push(mainsortBox);
sortBoxesContainer.push(mainsortBox.getElementsByClassName('sortbox__container')[0]);
sortBoxesNodes.push([]);
sortBoxesNumbers.push([]);
const sortInput = mainsortBox.getElementsByTagName('Input')[0];
inputDropDownEvents(sortInput);
const sortTimer = mainsortBox.getElementsByClassName('sortbox__timer')[0];
// Properties for each sort methods
sortBoxesConstants.push({
    sortInput: sortInput,
    sortWatch: new StopWatch(sortBoxesConstants.length, sortTimer, setTimeFirstSortToComplete),
    copyTemp: null,
    elemTemp: null,
    maxNum: 0,
    animationPlaying: false,
});
sortBoxesAlgoBoard.push({
    algoBoard: document.querySelector('.algorithm'),
    algoTitle: document.querySelector('.algorithm__title'),
    algoSteps: document.querySelector('.algorithm__steps'),
    algoTracker: document.querySelector('.algorithm__tracker'),
    moveToLineConstants: {
        prev: null,
        fontWeight: null,
        transform: null,
        topOnce: false,
    }
});

// iOS detection from: stackoverflow.com/a/9039885 with explanation about MSStream
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    input.setAttribute('pattern', '\\d*');
}
if (window.DeviceOrientationEvent) {
    window.addEventListener('orientationchange', function () { location.reload(); }, false);
}
function detectMobile() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}
function calculateScrollbarWidth(element) {
    if (!element) {
        // Return the body scrollbar width, when no element was specified.
        return window.innerWidth - document.body.clientWidth;
    } else {
        // When an element is specified, return its specific scrollbar width.
        return element.offsetWidth - element.clientWidth;
    }
}