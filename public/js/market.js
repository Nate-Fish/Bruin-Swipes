'use strict';
// import { useState } from React;
// import button from "material-ui";
// import Button from '@material-ui/core/Button';

// const button = window["MaterialUI"]


let locs = ['rende', 'epic', 'bplate', 'de neve', 'the drey', 'rende east :(', 'epicuria', 'study']
let times = ['2023-02-22T12:12', '2023-02-03T12:12', '2023-02-07T12:15']
let prices = [1, 2, 3, 5, 6, 76, 12, 14]
let all_data = []

// Generate template data
function generateData(){
    let counter = 0
    let buy = true
    for (let i = 0; i < locs.length; i++){
        for (let j = 0; j < times.length; j++){
            for (let p = 0; p < prices.length; p++){
                if (counter > 10) return;
                all_data.push([locs[i], times[j], prices[p], buy])
                buy = !buy
                counter++;
            }
        }
    }

}


function BuyButton({ buy, callback }){
    function handleClickBuy() {
        if(buy === undefined || !buy){
            console.log("filter by people selling");
            callback(true);
        }else{
            console.log("drop buy/sell filter");
            callback(undefined);
        }
    }
    return <button onClick={handleClickBuy} className="element_centered">Buy</button>
}

function SellButton({ buy, callback }){
    function handleClickSell() {
        if(buy === undefined || buy){
            console.log("filter by people buying");
            callback(false);
        }else{
            console.log("drop buy/sell filter");
            callback(undefined);
        }
    }
    return <button onClick={handleClickSell} className="element_centered">Sell</button>
}

function FilterButton({ callback }){
    function handleClickFilter() {
        console.log("filter")
        callback()
    }
    return <button onClick={handleClickFilter} className="element_centered">Filter</button>
}

function CreateListingButton({ callback }){
    function handleClickListing() {
        console.log("Listing")
        callback()
    }
    return <button onClick={handleClickListing} className="element_centered">Listing</button>
}

// Component that holds all the filters
function Filters({ filteredLocations, setFilteredLocations, lowerPrice, setLowerPrice, upperPrice, setUpperPrice, startTimeFilter, setStartTimeFilter, endTimeFilter, setEndTimeFilter }){   

    return <div className="temp">
        <LocationComponent filteredLocations={filteredLocations} setFilteredLocations={setFilteredLocations}/>
        <PriceComponent lowerPrice={lowerPrice} upperPrice={upperPrice} setLowerPrice={setLowerPrice} setUpperPrice={setUpperPrice}/>
        {/* <FilterTimeComponent callback={timeChangeCallback}/> */}
        <FilterTimeComponent startTimeFilter={startTimeFilter} setStartTimeFilter={setStartTimeFilter} endTimeFilter={endTimeFilter} setEndTimeFilter={setEndTimeFilter}/>
    </div>
}

// Time part of the filter component
function FilterTimeComponent({ startTimeFilter, setStartTimeFilter, endTimeFilter, setEndTimeFilter }){
    const [timeErrorMsg, setTimeErrorMsg] = React.useState('');
    const [startTime, setStartTime] = React.useState(startTimeFilter);
    const [endTime, setEndTime] = React.useState(endTimeFilter);

    function handleStartTimeChange(time){
        setStartTime(time);
        if(endTime === undefined || time.localeCompare(endTime) !== 1){
            setStartTimeFilter(time);
            setEndTimeFilter(endTime); 
            setTimeErrorMsg("");
        }else{
            setTimeErrorMsg("Error. Start time cannot be after end time.");
        }

    }
    function handleEndTimeChange(time){
        setEndTime(time);
        if(startTime === undefined || time.localeCompare(startTime) !== -1){
            setStartTimeFilter(startTime);
            setEndTimeFilter(time); 
            setTimeErrorMsg("");
        }else{
            setTimeErrorMsg("Error. Start time cannot be after end time.");
        }

    }

    return (
    <table className="margin">
        <thead>
            <tr>
                <th>Times</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <TimeBar callback={handleStartTimeChange} content="Start Time:" time={startTimeFilter}/>
                </td>
            </tr>
            <tr>
                <td>
                    <TimeBar callback={handleEndTimeChange} content="End Time:" time={endTimeFilter}/>
                </td>
            </tr>
            <tr>
                <td>
                    <p>{timeErrorMsg}</p>
                </td>
            </tr>
        </tbody>
    </table>);
}

// Price component for filters
function PriceComponent({ upperPrice, lowerPrice, setUpperPrice, setLowerPrice }){
    const [priceErrorMsg, setPriceErrorMsg] = React.useState('');
    const [upperInput, setUpperInput] = React.useState(upperPrice);
    const [lowerInput, setLowerInput] = React.useState(lowerPrice);

    function handlePriceError(msg){
        setPriceErrorMsg(msg)
    }

    function handleSetUpperPrice(value){
        setUpperInput(value);
        if(value >= lowerInput){
            if(value <= 100){
                if(lowerInput >= 0){
                    setUpperPrice(value);
                    setLowerPrice(lowerInput);
                    handlePriceError('');
                }else{
                    handlePriceError("Error, prices cannot be negative.");
                }
            }else{
                handlePriceError("Error, prices cannot exceed $100.");
            }
        }else{
            handlePriceError("Error, Upper cannot be smaller than Lower.");
        }
    }

    function handleSetLowerPrice(value){
        setLowerInput(value);
        if(value <= upperInput){
            if(value >= 0){
                if(upperInput <= 100){
                    setUpperPrice(upperInput);
                    setLowerPrice(value);
                    handlePriceError('');
                }else{
                    handlePriceError("Error, prices cannot exceed $100.");
                }
            }else{
                handlePriceError("Error, prices cannot be negative.");
            }
        }else{
            handlePriceError("Error, Upper cannot be smaller than Lower.");
        }
    }


    return <table className="margin">
        <thead>
            <tr>
                <th>
                    Price {upperPrice + ' ' + lowerPrice}
                </th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    {/* <UpperLimitBar lowerPrice={lowerPrice} errorCallback={(err) => {handlePriceError(err)}} setUpperPrice={setPrices}/> */}
                    <UpperLimitBar callback={handleSetUpperPrice} upperPrice={upperPrice}></UpperLimitBar>
                </td>
            </tr>
            <tr>
                <td>
                    {/* <LowerLimitBar upperPrice={upperPrice} errorCallback={(err) => {handlePriceError(err)}} setLowerPrice={setPrices}/> */}
                    <LowerLimitBar callback={handleSetLowerPrice} lowerPrice={lowerPrice}></LowerLimitBar>
                </td>
            </tr>
            <tr>
                <td>
                    <p>{priceErrorMsg}</p>
                </td>
            </tr>
        </tbody>
    </table>
}

// Component that gets a datetime from user
function TimeBar({ callback, content, time }){
    const [date, setDate] = React.useState(time);

    return (
        <form>
            <label>
                {content}
                <input type="datetime-local" defaultValue={time} onChange={(e) => {
                    console.log(e)
                    console.log(e.target.value)
                    console.log(typeof e.target.value)
                    setDate(e.target.value)
                    callback(e.target.value)
                }}/>
            </label>
        </form>
    );
}

function LowerLimitBar({ callback, lowerPrice }){
    const [field, setField] = React.useState(lowerPrice);

    return (
    <form onSubmit={(e) => {
        e.preventDefault();
        callback(parseInt(field));
    }}>
        <label>
            Lower: $
            <input type="number" value={field} onChange={(e) => {setField(e.target.value)}}/>
        </label>
    </form>
    );
}

function UpperLimitBar({ callback, upperPrice }){
    const [field, setField] = React.useState(upperPrice);

    return (
    <form onSubmit={(e) => {
        e.preventDefault();
        callback(parseInt(field));
    }}>
        <label>
            Upper: $
            <input type="number" value={field} onChange={(e) => {setField(e.target.value)}}/>
        </label>
    </form>
    );
}

function SearchBar({ searchCallback }){
    const [field, setField] = React.useState("")


    return <form>
        <label>
            Search:
            <input type="text" value={field} 
            onChange={(e) => {
                searchCallback(e.target.value)
                setField(e.target.value)
                }}
                />
        </label>
    </form>
}


function map_data(){
    return(
        all_data.map((vals, i) => {
        return (<tr key={i}>
            <td>
                {vals[0]}
            </td>
            <td>
                {vals[1]}
            </td>
            <td>
                {vals[2]}
            </td>
            <td>
                {vals[3] ? "Buy" : "Sell"}
            </td>
        </tr>)
    })
    );
}

// Table that holds the actual listing data
// The data comes from all_data array
function Grid({}){

    let rows = map_data();
    console.log(rows);

    return <table>
        <thead>
            <tr>
                <th>
                    Location
                </th>
                <th>
                    Date
                </th>
                <th>
                    Price
                </th>
                <th>
                    Buy/Sell
                </th>
            </tr>
        </thead>
        <tbody>
            {rows}
        </tbody>
    </table>
}

// Component to get location for filter and popup
function LocationComponent({ filteredLocations, setFilteredLocations, isCreate = false, error = ""}){
    // Change default from constant value thing to db call
    const [allLocations, setAllLocation] = React.useState(['Epicuria', 'De Neve', 'Bruin Plate', 'Feast', 'Bruin Cafe', 'Rendezvous', 'The Study', 'The Drey', 'Epic at Ackerman']);
    const [locations, setLocations] = React.useState(['Epicuria', 'De Neve', 'Bruin Plate', 'Feast', 'Bruin Cafe', 'Rendezvous', 'The Study', 'The Drey', 'Epic at Ackerman']);

    const locs = locations.map((loc, i) => {
        return (
        <li key={i}>
            <label>{loc}</label>
            <button className={checkIn(loc) !== -1 ? "selected" : "notSelected"} onClick={() => updateFilteredLocations(loc)}>Check box</button>
        </li>
        );
    })

    function updateFilteredLocations(loc){
        let copy = (isCreate ? [] : filteredLocations.slice())
        let ind = checkIn(loc)
        if (ind !== -1) copy.splice(ind, 1);
        else copy.push(loc)
        console.log(copy)
        setFilteredLocations(copy)
    }
    function addAll(){
        let temp = []
        for (let j = 0; j < locations.length; j++){
            temp.push(locations[j])
        }
        setFilteredLocations(temp)
    }
    function checkIn(loc){
        for (let j = 0; j < filteredLocations.length; j++){
            if (filteredLocations[j] === loc) return j;
        }
        return -1;
    }
    function updateSearch(text){
        // find new locations
        let curr = []
        let n = text.length;
        for (let i = 0; i < allLocations.length; i++){
            if (allLocations[i].length >= n && allLocations[i].substring(0, n) === text) curr.push(allLocations[i])
        }

        // update current filtered locations
        // probably remove but its lowkey sick af
        let filteredCopy = filteredLocations.slice()
        for (let i = 0; i < filteredCopy.length; i++){
            let flag = false;
            for (let j = 0; j < curr.length; j++){
                if (curr[j] === filteredCopy[i]) flag = true;
            }
            if (!flag) {
                filteredCopy.splice(i, 1);
            }
        }
        setFilteredLocations(filteredCopy)
        setLocations(curr)
        
    }

    return <table className="margin">
        <thead>
            <tr>
                <th>Locations</th>
            </tr>
        </thead>
        <tbody>
            {!isCreate ? 
            <tr>
                <td>
                    <button onClick={addAll}>Select All</button>
                    <button onClick={() => {setFilteredLocations([])}}>Unselect All</button>
                </td>
            </tr>
            : <></>}
            <tr>
                <td>
                    <SearchBar searchCallback={(e) => {updateSearch(e)}}/>
                </td>
            </tr>
            <tr>
                <td>
                    <ul className="scroller">
                        {locs}
                    </ul>
                </td>
            </tr>
            <tr>
                <td>{error}</td>
            </tr>
        </tbody>
    </table>
}

// Component for when your making a listing and choosing the price
function ListingPriceComponent({ filterCallback, buyCallback, isBuyDefault, priceDefault, rawCallback }){
    const [isBuy, setIsBuy] = React.useState(isBuyDefault);
    const [field, setField] = React.useState(priceDefault);
    const [error, setError] = React.useState('');

    function flipBuy(){
        buyCallback(!isBuy)
        setIsBuy(!isBuy)
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>Price</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <button className={isBuy ? "selected-buy" : "not-selected-buy"} onClick={flipBuy}>Buy</button>
                    </td>
                    <td>
                        <button className={!isBuy ? "selected-buy" : "not-selected-buy"} onClick={flipBuy}>Sell</button>
                    </td>
                </tr>
                <tr>
                    <td>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            if (parseInt(field) > -1 && parseInt(field) < 100){
                                filterCallback(field)
                                setError('')
                            }
                            else{
                                setError('Price must be between 0 and 100 dollars')
                            }
                        }}>
                            <label>
                                Price: $
                                <input type="number" value={field} onChange={(e) => {
                                    rawCallback(e.target.value)
                                    setField(e.target.value)}}/>
                            </label>
                        </form>
                    </td>
                    <td>
                        <p>{error}</p>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

// Component to confirm the listing before you actually make it
function ConfirmComponent({ locations, isBuy, price, time }){
    return (<table>
        <thead>
            <tr>
                <th>Your new listing</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{isBuy ? "Buying" : "Selling"}</td>
            </tr>
            <tr>
                <td>{locations}</td>
            </tr>
            <tr>
                <td>{price}</td>
            </tr>
            <tr>
                <td>time lmfao</td>
            </tr>
        </tbody>
    </table>);
}

function Popup({ handleClose }){
    const [stage, setStage] = React.useState(0)
    const [isBuy, setIsBuy] = React.useState(true)
    const [locs, setLocs] = React.useState([])
    const [locError, setLocError] = React.useState('')
    const [price, setPrice] = React.useState(8)
    const [rawPrice, setRawPrice] = React.useState(8)
    const [time, setTime] = React.useState("rn")
    let stages = [
        <LocationComponent filteredLocations={locs} setFilteredLocations={(e) => setLocs(e)} isCreate={true} error={locError}/>,
        <ListingPriceComponent rawCallback={(e) => setRawPrice(e)} filterCallback={(e) => setPrice(e)} buyCallback={(e) => setIsBuy(e)} isBuyDefault={isBuy} priceDefault={price}/>,
        <p>Choose Time</p>,
        <ConfirmComponent locations={locs} isBuy={isBuy} price={price} time={time}/>
    ]

    function nextClicked(){
        console.log(locs)
        if (stage == 0 && locs.length != 1) 
            setLocError('Select a location')
        else if(stage == 1){
            if (rawPrice < 100 && rawPrice >= 0) 
                setPrice(rawPrice)
            setStage(stage + 1)
        }
        else if (stage != stages.length - 1){
            setStage(stage + 1)
            setLocError('')
        }
        else{
            // Add db call to actually make new listing here
            // RN it just puts it in all_data
            console.log("made a new listing swag")
            all_data.push([locs[0], time, price, isBuy])
            handleClose()
        }
            
        
    }

    function backClicked(){
        if (stage == 0)
            handleClose()
        else
            setStage(stage - 1)
    }

    return (
    <div className="popup-box">
        <div className="box">
            <span className="close-icon" onClick={handleClose}>x</span>
            <span className="back-icon" onClick={backClicked}>{'<-'}</span>
            {stages[stage]}
            <table>
                <tbody>
                    <tr>
                        <td>
                            <button onClick={handleClose}>Cancel</button>    
                        </td>
                        <td>
                            <button onClick={nextClicked}>{stage === stages.length - 1 ? "Create Listing" : "Next"}</button>
                        </td>    
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    );
}

// Functions used for testing purposes
// function Ophir(){
//     async function callback(){
//         let body = {
//             location: "Test",
//             time: "Was",
//             price: "Here",
//             time_posted: "This",
//             resolved: false,
//             selling: "Proof",
//         };
//         console.log(await makeRequest('/post-listing', body));
//     }
//     return (<>
//         Click to insert to DB
//         <button onClick={callback}>
//             CLICK ME!
//         </button>
//     </>);
// }

// function Ophir2({func}){
//     async function callback(){
//         let body = {
//             locations: undefined,
//             price_range: {
//                 price_min: undefined,
//                 price_max: undefined
//             },
//             time_range: {
//                 time_min: undefined,
//                 time_max: undefined
//             },
//             selling: undefined,
//             sort: {
//                 order_by: undefined,
//                 asc: undefined
//             }
//         };
//         func(await makeRequest('/get-listings', body));

//     }
//     return (<>
//         Click to get listings
//         <button onClick={callback}>
//             {all_data}
//         </button>
//     </>);
// }

// function Combine_states({ filteredLocations, lowerPrice, upperPrice, showBuys, startTimeFilter, endTimeFilter }){
//     function show_states(){
//         console.log("filteredLocations: ", filteredLocations);
//         console.log("lowerPrice: ", lowerPrice);
//         console.log("upperPrice: ", upperPrice);
//         console.log("showBuys: ", showBuys);
//         console.log("startTimeFilter: ", startTimeFilter);
//         console.log("endTimeFilter: ", endTimeFilter);
//     }
//     return (<>
//         <button onClick={show_states}>
//             click me to log all states!
//         </button>
//     </>);
// }

// main compoenent that holds everything
// All filters come back here, so probably get data from db here and pass filters here as well
function main(){
    //keep state of everything we need

    //keep state of display settings
    const [showFilter, setShowFilter] = React.useState(false);
    const [showPopup, setShowPopup] = React.useState(false);

    //keep state of filter values
    const [filteredLocations, setFilteredLocations] = React.useState([]);
    const [lowerPrice, setLowerPrice] = React.useState(0);
    const [upperPrice, setUpperPrice] = React.useState(20);
    const [showBuys, setShowBuys] = React.useState(undefined)
    const [startTimeFilter, setStartTimeFilter] = React.useState(undefined)
    const [endTimeFilter, setEndTimeFilter] = React.useState(undefined)

    //keep state of queried results
    const [all_data, setAllData] = React.useState([])

    return <>
        <div className="div_class">
            <BuyButton buy={showBuys} callback={setShowBuys}/>
            <SellButton buy={showBuys} callback={setShowBuys}/>
        </div>
        <div className="div_class">
            <>
                <FilterButton callback={() => setShowFilter(!showFilter)}/>
                <CreateListingButton callback={() => setShowPopup(!showPopup)}/>
            </>
        </div>
        <div>
            {showFilter ? <Filters 
            filteredLocations={filteredLocations}
            setFilteredLocations={setFilteredLocations}
            lowerPrice={lowerPrice}
            setLowerPrice={setLowerPrice}
            upperPrice={upperPrice}
            setUpperPrice={setUpperPrice}
            startTimeFilter={startTimeFilter}
            setStartTimeFilter={setStartTimeFilter}
            endTimeFilter={endTimeFilter}
            setEndTimeFilter={setEndTimeFilter}
            // timeChangeCallback={(t1, t2) => {
            //     setStartTimeFilter(t1)
            //     setEndTimeFilter(t2)
            // }}
            /> : <></>}
        </div>
        <div>
            {showPopup ? <Popup content="Some text" handleClose={() => setShowPopup(!showPopup)}/> : <></>}
        </div>
        <div>
            <Grid />
        </div>
        {/* Components used for testing purposes
        <Ophir></Ophir>
        <Ophir2 func={setAllData}>all_data</Ophir2>
        <Combine_states filteredLocations={filteredLocations} lowerPrice={lowerPrice} upperPrice={upperPrice} showBuys={showBuys} startTimeFilter={startTimeFilter} endTimeFilter={endTimeFilter}>
            test
        </Combine_states> */}
    </>
}

generateData();
const rootNode = document.getElementById('market-root');
const root = ReactDOM.createRoot(rootNode);
root.render(React.createElement(main));