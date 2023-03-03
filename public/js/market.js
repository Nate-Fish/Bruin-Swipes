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


function BuyButton({ callback }){
    function handleClickBuy() {
        console.log("handling click from buy")
        callback()
    }
    return <button onClick={handleClickBuy} className="element_centered">Buy</button>
}

function SellButton({ callback }){
    function handleClickSell() {
        console.log("handling click from sell")
        callback()
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
function Filters({ filteredLocations, filteredLocationsCallback, priceChangeCallback, timeChangeCallback }){   

    return <div className="temp">
        <LocationComponent filteredLocations={filteredLocations} callback={filteredLocationsCallback}/>
        <PriceComponent callback={priceChangeCallback}/>
        <FilterTimeComponent callback={timeChangeCallback} />
    </div>
}

// Time part of the filter component
function FilterTimeComponent({ callback }){
    const [startTime, setStartTime] = React.useState("")
    const [endTime, setEndTime] = React.useState("")

    function handleStartTimeChange(time){
        setStartTime(time)
        callback(startTime, endTime)
    }
    function handleEndTimeChange(time){
        setEndTime(time)
        callback(startTime, endTime)
    }

    return (
    <table className="margin">
        <tr>
            <th>Times</th>
        </tr>
        <tr>
            <td>
                <TimeBar callback={handleStartTimeChange} content="Start Time:"/>
            </td>
        </tr>
        <tr>
            <td>
                <TimeBar callback={handleEndTimeChange} content="End Time:"/>
            </td>
        </tr>
    </table>);
}

// Price component for filters
function PriceComponent({ callback }){
    const [upperPrice, setUpperPrice] = React.useState(20);
    const [lowerPrice, setLowerPrice] = React.useState(0);
    const [priceErrorMsg, setPriceErrorMsg] = React.useState('');

    function handleUpperPriceChange(val){
        setUpperPrice(val);
        callback(lowerPrice, upperPrice)
    }
    function handleLowerPriceChange(val){
        setLowerPrice(val);
        callback(lowerPrice, upperPrice)
    }
    function handlePriceError(msg){
        setPriceErrorMsg(msg)
    }

    return <table calssName="margin">
        <tr>
            <th>
                Price {upperPrice + ' ' + lowerPrice}
            </th>
        </tr>
        <tr>
            <td>
                <UpperLimitBar lowerValue={lowerPrice} errorCallback={(err) => {handlePriceError(err)}} filterCallback={(e) => {handleUpperPriceChange(e)}}/>
            </td>
        </tr>
        <tr>
            <td>
                <LowerLimitBar upperValue={upperPrice} errorCallback={(err) => {handlePriceError(err)}} filterCallback={(e) => {handleLowerPriceChange(e)}} />
            </td>
        </tr>
        <tr>
            <p>{priceErrorMsg}</p>
        </tr>
    </table>
}

// Component that gets a datetime from user
function TimeBar({ callback, content }){
    const [date, setDate] = React.useState("")

    return (
        <form>
            <label>
                {content}
                <input type="datetime-local" onChange={(e) => {
                    console.log(e.target.value)
                    console.log(typeof e.target.value)
                    setDate(e.target.value)
                    callback(e.target.value)
                }}/>
            </label>
        </form>
    );
}

function LowerLimitBar({ filterCallback, errorCallback, upperValue }){
    const [field, setField] = React.useState(0);

    return (
    <form onSubmit={(e) => {
        e.preventDefault()
        if (parseInt(field) < parseInt(upperValue) && parseInt(field) >= 0){
            filterCallback(field)
            errorCallback('')
        } 
        else{
            errorCallback('Invalid lower value')
        }
    }}>
        <label>
            Lower: $
            <input type="number" value={field} onChange={(e) => {setField(e.target.value)}}/>
        </label>
    </form>
    );
}

function UpperLimitBar({ filterCallback, errorCallback, lowerValue }){
    const [field, setField] = React.useState(20);

    return (
    <form onSubmit={(e) => {
        e.preventDefault()
        if (parseInt(field) > parseInt(lowerValue) && parseInt(field) < 100){
            filterCallback(field)
            errorCallback('')
        }
        else{
            errorCallback('Invalid upper value')
        }
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
// Table that holds the actual listing data
// The data comes from all_data array
function Grid({}){

    const rows = all_data.map((vals, i) => {
        return <tr key={i}>
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
        </tr>
    })

    return <table>
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
        {rows}
    </table>
}

// Component to get location for filter and popup
function LocationComponent({ filteredLocations, callback, isCreate = false, error = ""}){
    // Change default from constant value thing to db call
    const [allLocations, setAllLocation] = React.useState(['rende', 'epic', 'everything else'])
    const [locations, setLocations] = React.useState(['rende', 'epic', 'everything else'])

    const locs = locations.map((loc, i) => {
        return <li key={i}>
            <label>{loc}</label>
            <button className={checkIn(loc) !== -1 ? "selected" : "notSelected"} onClick={() => {updateFilteredLocations(loc)}}>Check box</button>
        </li>
    })

    function setFilteredLocations(filter){
        callback(filter)
    }
    function updateFilteredLocations(loc){
        let copy = (isCreate ? [] : filteredLocations.slice())
        let ind = checkIn(loc)
        if (ind !== -1) delete copy[ind]
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
    function checkIn(i){
        for (let j = 0; j < filteredLocations.length; j++){
            if (filteredLocations[j] === i) return j;
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
                delete filteredCopy[i];
            }
        }
        setFilteredLocations(filteredCopy)
        setLocations(curr)
        
    }

    return <table className="margin">
        <tr>
            <th>Locations</th>
        </tr>
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
            <tr>
                <th>Price</th>
            </tr>
            <tr>
                <button className={isBuy ? "selected-buy" : "not-selected-buy"} onClick={flipBuy}>Buy</button>
                <button className={!isBuy ? "selected-buy" : "not-selected-buy"} onClick={flipBuy}>Sell</button>
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
            <p>{error}</p>
        </tr>
    </table>
    );
}

// Component to confirm the listing before you actually make it
function ConfirmComponent({ locations, isBuy, price, time }){
    return <table>
        <tr>
            <th>Your new listing</th>
        </tr>
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
    </table>
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
        <LocationComponent filteredLocations={locs} callback={(e) => setLocs(e)} isCreate={true} error={locError}/>,
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
                <tr>
                    <button onClick={handleClose}>Cancel</button>
                    <button onClick={nextClicked}>{stage === stages.length - 1 ? "Create Listing" : "Next"}</button>
                </tr>
            </table>
            </div>
    </div>
    );
}

// main compoenent that holds everything
// All filters come back here, so probably get data from db here and pass filters here as well
function main(){
    const [showFilter, setShowFilter] = React.useState(false);
    const [showPopup, setShowPopup] = React.useState(false);
    const [filteredLocations, setFilteredLocations] = React.useState([]);
    const [lowerPrice, setLowerPrice] = React.useState(0);
    const [upperPrice, setUpperPrice] = React.useState(20);
    const [showBuys, setShowBuys] = React.useState(true)
    const [startTimeFilter, setStartTimeFilter] = React.useState("")
    const [endTimeFilter, setEndTimeFilter] = React.useState("")

    return <>
        <div className="div_class">
            <BuyButton callback={() => setShowBuys(!showBuys)}/>
            <SellButton callback={() => setShowBuys(!showBuys)}/>
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
            timeChangeCallback={(t1, t2) => {
                setStartTimeFilter(t1)
                setEndTimeFilter(t2)
            }} 
            priceChangeCallback={(l, u) => {
                setLowerPrice(l);
                setUpperPrice(u)
            }} 
            filteredLocationsCallback={(i) => {setFilteredLocations(i)}}/> : <></>}
        </div>
        <div>
            {showPopup ? <Popup content="Some text" handleClose={() => setShowPopup(!showPopup)}/> : <></>}
        </div>
        <div>
            <Grid />
        </div>
    </>
}

generateData();
const rootNode = document.getElementById('market-root');
const root = ReactDOM.createRoot(rootNode);
root.render(React.createElement(main));