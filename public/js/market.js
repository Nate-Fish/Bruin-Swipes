'use strict';

// import { useState } from React;
// import button from "material-ui";
// import Button from '@material-ui/core/Button';

// const button = window["MaterialUI"]


let locs = ['Epicuria', 'De Neve', 'Bruin Plate', 'Feast', 'Bruin Cafe', 'Rendezvous', 'The Study', 'The Drey', 'Epic at Ackerman'];
let times = ['2023-02-22T12:12', '2023-02-03T12:12', '2023-02-07T12:15', '2023-03-02T12:15', '2023-04-30T12:15'];
let prices = [1, 2, 3, 4, 5];
let buy = [true, false];

// Generate template data
function populate_sample_data(){
    for(let i = 0; i < locs.length; i++){
        for(let j = 0; j < times.length; j++){
            for(let k = 0; k < prices.length; k++){
                for(let l = 0; l < buy.length; l++){
                    let body = {
                        location: locs[i],
                        time: times[j],
                        price: prices[k],
                        time_posted: "2023-03-8T14:05",
                        resolved: false,
                        selling: buy[l]
                    };
                    makeRequest('/post-listing', body);
                }
            }
        }
    }
}


function BuyButton({ buy, callback, update_query }){
    function handleClickBuy() {
        if(buy === undefined || !buy){
            callback(true);
            update_query({showBuys: true});
        }else{
            callback(undefined);
            update_query({showBuys: "undefined"});
        }
    }
    return <button onClick={handleClickBuy} className="bruin-button">View Buy Listings</button>
}

function SellButton({ buy, callback, update_query }){
    function handleClickSell() {
        if(buy === undefined || buy){
            callback(false);
            update_query({showBuys: false});
        }else{
            callback(undefined);
            update_query({showBuys: "undefined"});
        }
    }
    return <button onClick={handleClickSell} className="bruin-button">View Sell Listings</button>
}

function FilterButton({ callback }){
    function handleClickFilter() {
        callback()
    }
    return <button onClick={handleClickFilter} className="bruin-button">Filters</button>
}

function CreateListingButton({ callback }){
    function handleClickListing() {
        callback()
    }
    return <button onClick={handleClickListing} className="bruin-button">Create Listing</button>
}

// Component that holds all the filters
function Filters({ filteredLocations, setFilteredLocations, lowerPrice, setLowerPrice, upperPrice, setUpperPrice, startTimeFilter, setStartTimeFilter, endTimeFilter, setEndTimeFilter, update_query }){   

    return (<>
    <hr></hr>
    <div className="filter_class">
        {/* <LocationComponent filteredLocations={filteredLocations} setFilteredLocations={setFilteredLocations} update_query={update_query}/> */}
        <PriceComponent lowerPrice={lowerPrice} upperPrice={upperPrice} setLowerPrice={setLowerPrice} setUpperPrice={setUpperPrice} update_query={update_query}/>
        <FilterTimeComponent startTimeFilter={startTimeFilter} setStartTimeFilter={setStartTimeFilter} endTimeFilter={endTimeFilter} setEndTimeFilter={setEndTimeFilter} update_query={update_query}/>
    </div>
    <div className="filter_class">
        <LocationComponent filteredLocations={filteredLocations} setFilteredLocations={setFilteredLocations} update_query={update_query}/>
    </div>
    <hr></hr>
    </>);
}

// Time part of the filter component
function FilterTimeComponent({ startTimeFilter, setStartTimeFilter, endTimeFilter, setEndTimeFilter, update_query }){
    const [timeErrorMsg, setTimeErrorMsg] = React.useState('');
    const [startTime, setStartTime] = React.useState(startTimeFilter);
    const [endTime, setEndTime] = React.useState(endTimeFilter);

    function handleStartTimeChange(time){
        setStartTime(time);
        if(time){
            if(endTime === undefined || time.localeCompare(endTime) !== 1){
                setStartTimeFilter(time);
                setEndTimeFilter(endTime); 
                setTimeErrorMsg("");
                update_query({time_min: time, time_max: endTime});
            }else{
                setTimeErrorMsg("Error. Start time cannot be after end time.");
            }
        }else{
            setStartTimeFilter(undefined);
            setStartTime(undefined);
            setEndTimeFilter(endTime); 
            setTimeErrorMsg("");
            update_query({time_min: "undefined", time_max: endTime});
        }


    }
    function handleEndTimeChange(time){
        setEndTime(time);
        if(time){
            if(startTime === undefined || time.localeCompare(startTime) !== -1){
                setStartTimeFilter(startTime);
                setEndTimeFilter(time); 
                setTimeErrorMsg("");
                update_query({time_min: startTime, time_max: time});
            }else{
                setTimeErrorMsg("Error. Start time cannot be after end time.");
            }
        }else{
            setStartTimeFilter(startTime);
            setEndTimeFilter(undefined);
            setEndTime(undefined); 
            setTimeErrorMsg("");
            update_query({time_min: startTime, time_max: "undefined"});
        }
    }

    return (
    <table className="filter-price">
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
function PriceComponent({ upperPrice, lowerPrice, setUpperPrice, setLowerPrice, update_query }){
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
                    update_query({price_max: value, price_min: lowerInput});
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
                    update_query({price_max: upperInput, price_min: value});
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


    return <table className="filter-price">
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
                    <UpperLimitBar callback={handleSetUpperPrice} upperPrice={upperPrice}></UpperLimitBar>
                </td>
            </tr>
            <tr>
                <td>
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


    return <form onSubmit={e => {e.preventDefault();}}>
        <label className="loc-search-bar">
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

function unpack_date(date){
    let year = Number(date.slice(0, 4));
    let month = Number(date.slice(5, 7));
    let day = Number(date.slice(8, 10));
    let hour = Number(date.slice(11, 13));
    let minute = date.slice(14, 16);
    let am = true;
    if(hour >= 12){
        am = false;
    }
    if(hour > 12){
        hour = hour - 12;
    }
    if(hour < 10){
        hour = "0" + hour;
    }
    if(month == 1){
        month = "January";
    }else if(month == 2){
        month = "Febraury";
    }else if(month == 3){
        month = "March";
    }else if(month == 4){
        month = "April";
    }else if(month == 5){
        month = "May";
    }else if(month == 6){
        month = "June";
    }else if(month == 7){
        month = "July";
    }else if(month == 8){
        month = "August";
    }else if(month == 9){
        month = "September";
    }else if(month == 10){
        month = "October";
    }else if(month == 11){
        month = "November";
    }else{
        month = "December";
    }
    let combined_date = hour + ":" + minute + " " + (am ? "AM":"PM") + ", " + month + " " + day + ", " + year;
    return combined_date;
}

async function send_message(vals){
    await makeRequest("/send-messages", {
        email: vals.user["email"],
        message: vals["selling"] ? "Hey! I'm interested in buying your " + vals["location"] + " swipe for " + "$" + vals["price"] + ".00 on " + unpack_date(vals["time"]) :
        "Hey! I'm interested in selling you a swipe at " + vals["location"] + " for " + "$" + vals["price"] + ".00 on " + unpack_date(vals["time"])
    });
    window.location.href = "messages.html?email=" + vals.user["email"];
}

function message_button(vals){
    if(email !== vals.user["email"]){
        return (<button className="sm-bruin-button" onClick={() => send_message(vals)}>
        Interested?
        </button>)
    }else{
        return <></>
    }
}


function map_data(all_data, index){
    let lowerBound = index*50;
    let upperBound = all_data.length >= 50*(index+1) ? 50*(index+1) : all_data.length;
    let all_data_copy = all_data.slice(lowerBound, upperBound);
    return(
        all_data_copy.map((vals, i) => {
        return (
        // <div className="colored">
            <tr className={i % 2 == 0 ? "alternated-row" : "other-row"}key={i}>
            
                <td >
                    {vals["location"]}
                </td>
                <td>
                    {unpack_date(vals["time"])}
                </td>
                <td>
                    {"$" + vals["price"] + ".00"}
                </td>
                <td>
                    {vals.user.firstname + " " + vals.user.lastname}
                </td>
                <td>
                    {vals["selling"] ? "Selling" : "Buying"}
                </td>
                <td>
                    {message_button(vals)}
                </td>
            </tr>
        )
    })
    );
}

// Table that holds the actual listing data
// The data comes from all_data array
function Grid({ sortKey, setSortKey, asc, setAsc, all_data, update_query, index, setIndex }){

    const [firstRendered, setFirstRendered] = React.useState(true);

    if(firstRendered){
        setFirstRendered(false);
        update_query();
    }

    //console.log("All data: ", all_data);
    if(Array.isArray(all_data)){
    
        function handleClick(sort){
            if(sortKey === sort && asc !== undefined && asc === true){
                setAsc(false);
                update_query({asc: false});
            }else if (sortKey === sort && asc !== undefined && asc === false){
                setSortKey(undefined);
                setAsc(undefined);
                update_query({sortKey: "undefined", asc: "undefined"});
            }else{
                setSortKey(sort);
                setAsc(true);
                update_query({sortKey: sort, asc: true});

            }
        }
    
        return (
        <div className="grid-background">
            <table className="grid_class">
                <thead>
                    <tr className="top-row">
                        <th className="grid-background-left-th" onClick={() => handleClick("location")}>
                            {sortKey === "location" ? (!asc ? "Location\u25B4" : "Location\u25BE") : "Location"}
                        </th>
                        <th onClick={() => handleClick("time")}>
                            {sortKey === "time" ? (!asc ? "Date\u25B4" : "Date\u25BE") : "Date"}
                        </th>
                        <th onClick={() => handleClick("price")}>
                            {sortKey === "price" ? (!asc ? "Price\u25B4" : "Price\u25BE") : "Price"}
                        </th>
                        <th>
                            Name
                        </th>
                        <th className="grid-background-right-th">
                            Buy/Sell
                        </th>
                        <th>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {map_data(all_data, index)}
                </tbody>
            </table>
            <table className="grid_class">
                <tbody>
                    <tr>
                        <td className="bottom-row">
                            <button className="sm-bruin-button" onClick={() => {
                                if (index > 0) setIndex(index - 1);
                                }}>Previous
                            </button>
                            <p>{(all_data.length ? (index*50 + 1) : 0) + " - " + ((index + 1)*50 < all_data.length ? (index + 1)*50 : all_data.length) + "/" + all_data.length}</p>
                            <button className="sm-bruin-button" onClick={() => {
                                if ((index + 1)*50 < all_data.length) setIndex(index + 1);
                                }}>Next
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        )
    }else{
        return <></>
    } 
}

// Component to get location for filter 
function LocationComponent({ filteredLocations, setFilteredLocations, update_query, isCreate = false, error = ""}){
    // Change default from constant value thing to db call
    const [allLocations, setAllLocation] = React.useState(['Epicuria', 'De Neve', 'Bruin Plate', 'Feast', 'Bruin Cafe', 'Rendezvous', 'The Study', 'The Drey', 'Epic at Ackerman']);
    const [locations, setLocations] = React.useState(['Epicuria', 'De Neve', 'Bruin Plate', 'Feast', 'Bruin Cafe', 'Rendezvous', 'The Study', 'The Drey', 'Epic at Ackerman']);

    const locs = locations.map((loc, i) => {
        return (
        <div className="loc-search-item" key={i} onClick={() => updateFilteredLocations(loc)}>
            <input checked={checkIn(loc) !== -1} type="checkbox" onChange={() => updateFilteredLocations(loc)}></input> {/* className={checkIn(loc) !== -1 ? "loc-selected" : "loc-not-selected"} */}
            <label>{loc}</label>
        </div>
        );
    })

    function updateFilteredLocations(loc){
        let copy = (isCreate ? [] : filteredLocations.slice())
        let ind = checkIn(loc)
        if (ind !== -1) copy.splice(ind, 1);
        else copy.push(loc)
        setFilteredLocations(copy)
        update_query({locations: copy});
    }
    function addAll(){
        let temp = []
        for (let j = 0; j < locations.length; j++){
            temp.push(locations[j])
        }
        setFilteredLocations(temp)
        update_query({locations: temp});
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
            if (allLocations[i].length >= n && allLocations[i].substring(0, n).toLowerCase() === text.toLowerCase()) curr.push(allLocations[i])
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
        update_query({locations: curr});
        
    }

    return <table className="location-class">
        <thead>
            <tr>
                <th>Locations</th>
            </tr>
        </thead>
        <tbody>
            {/* {!isCreate ? 
            <tr>
                <td className="loc-top-row">
                    <button className="loc-bruin-button" onClick={addAll}>Select All</button>
                    <button className="loc-bruin-button" onClick={() => {setFilteredLocations([]); update_query({locations: []});}}>Unselect All</button>
                </td>
            </tr>
            : <></>} */}
            {/* <tr>  className="loc-outer-search" 
                <td>
                    <SearchBar searchCallback={(e) => {updateSearch(e)}}/>
                </td>
            </tr> */}
            <tr> {/* className="loc-outer-search" */}
                <td className="loc-list-items">
                    {/* <ul className="scroller"> */}
                        {locs}
                    {/* </ul> */}
                </td>
            </tr>
            <tr>
                <td>{error}</td>
            </tr>
        </tbody>
    </table>
}

function ListingLocationComponent({ locationListed, setLocationListed, locationError }){
    // Change default from constant value thing to db call
    const [allLocations, setAllLocation] = React.useState(['Epicuria', 'De Neve', 'Bruin Plate', 'Feast', 'Bruin Cafe', 'Rendezvous', 'The Study', 'The Drey', 'Epic at Ackerman']);
    const [locations, setLocations] = React.useState(['Epicuria', 'De Neve', 'Bruin Plate', 'Feast', 'Bruin Cafe', 'Rendezvous', 'The Study', 'The Drey', 'Epic at Ackerman']);

    const locs = locations.map((loc, i) => {
        return (
        <div className="loc-search-item" key={i} onClick={() => setLocationListed(loc)}>
            <input checked={loc === locationListed} type="checkbox" onChange={() => setLocationListed(loc)}></input> {/* className={checkIn(loc) !== -1 ? "loc-selected" : "loc-not-selected"} */}
            <label>{loc}</label>
        </div>
        );
    })

    return <table className="location-class">
        <thead>
            <tr>
                <th>Choose where you're selling the swipe:</th>
            </tr>
        </thead>
        <tbody>
            {/* <tr>
                <td>
                    <SearchBar searchCallback={(e) => {updateSearch(e)}}/>
                </td>
            </tr> */}
            <tr>
                <td className="loc-list-items">
                    {/* <ul className="scroller"> */}
                        {locs}
                    {/* </ul> */}
                </td>
            </tr>
            <tr>
                <td>{locationError}</td>
            </tr>
        </tbody>
    </table>
}

// Component for when your making a listing and choosing the price
function ListingPriceComponent({isBuy, setIsBuy, priceListed, setPriceListed, priceInput, setPriceInput, priceError, setPriceError}){

    function flipBuy(){
        setIsBuy(!isBuy)
    }


    return (
        <table className="listing-price">
            <thead>
                <tr>
                    <th>How much for the swipe?</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            
                            }}>
                            <label>
                                $
                                <input type="number" defaultValue={Number.isNaN(priceListed) ? "" : priceListed} onChange={(e) => {
                                    setPriceListed(parseInt(e.target.value));
                                }}/>
                            </label>
                        </form>
                    </td>
                    <td >
                        <button className={isBuy ? "selected-buy" : "not-selected-buy"} onClick={() => setIsBuy(!isBuy)}>Buy</button>
                        <button className={!isBuy ? "selected-buy" : "not-selected-buy"} onClick={() => setIsBuy(!isBuy)}>Sell</button>
                    </td>
                    <td>
                        <p>{priceError}</p>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

function ListingTimeComponent({ timeListed, setTimeListed, timeError, setTimeError, isBuy }){

    function handleTimeChange(time){
        if(time){
            setTimeListed(time);
            setTimeError("");
        }else{
            setTimeListed(undefined);
        }

    }

    return (
    <table className="listing-price">
        <thead>
            <tr>
                <th>{"When are you " + (isBuy ? "buying" : "selling") + "?"}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <TimeBar callback={handleTimeChange} content="Choose Time:" time={timeListed}/>
                </td>
            </tr>
            <tr>
                <td>
                    <p>{timeError}</p>
                </td>
            </tr>
        </tbody>
    </table>);
}

// Component to confirm the listing before you actually make it
function ListingConfirmComponent({ locationListed, isBuy, priceListed, timeListed }){
    return (<table className="listing-price">
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
                <td>{locationListed}</td>
            </tr>
            <tr>
                <td>{"$" + priceListed + ".00"}</td>
            </tr>
            <tr>
                <td>{unpack_date(timeListed)}</td>
            </tr>
        </tbody>
    </table>);
}

function Popup({ stage, setStage, locationListed, setLocationListed, locationError, setLocationError, isBuy, setIsBuy, priceListed, setPriceListed, priceInput, setPriceInput,
    priceError, setPriceError, timeListed, setTimeListed, timeInput, setTimeInput, timeError, setTimeError, showPopup, setShowPopup, make_listing }){
    let stages = [
        <ListingLocationComponent locationListed={locationListed} setLocationListed={setLocationListed}
        locationError={locationError} setLocationError={setLocationError}/>,
        <ListingPriceComponent isBuy={isBuy} setIsBuy={setIsBuy}
        priceListed={priceListed} setPriceListed={setPriceListed}
        priceInput={priceInput} setPriceInput={setPriceInput}
        priceError={priceError} setPriceError={setPriceError}/>,
        <ListingTimeComponent timeListed={timeListed} setTimeListed={setTimeListed}
        timeInput={timeInput} setTimeInput={setTimeInput}
        timeError={timeError} setTimeError={setTimeError} isBuy={isBuy}/>,
        <ListingConfirmComponent locationListed={locationListed} isBuy={isBuy} priceListed={priceListed} timeListed={timeListed}/>
    ]



    function handleClose(){
        setShowPopup(!showPopup)
        setStage(0);
    }


    function nextClicked(){
        if(stage === 0){
            if(locationListed === undefined){
                setLocationError('Select a location');
            }else{
                setStage(stage+1);
            }
        }else if (stage === 1){
            if(Number.isNaN(priceListed)){
                setPriceError('Enter a price');
            }else if (priceListed < 0 || priceListed > 100){
                setPriceError('Enter a number between 0 and 100');
            }else{
                setPriceError('');
                setStage(stage+1);
            }
        }else if (stage === 2){
            if(timeListed === undefined){
                setTimeError('Choose a time');
            }else{
                setStage(stage+1);
            }
        }else{
            make_listing();
            handleClose();
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
    const [sortKey, setSortKey] = React.useState(undefined);
    const [asc, setAsc] = React.useState(undefined);

    //keep state of the table display parameters
    const [all_data, setAllData] = React.useState([]);
    const [index, setIndex] = React.useState(0);

    //keep state of listing settings
    const [stage, setStage] = React.useState(0)
    const [locationListed, setLocationListed] = React.useState(undefined)
    const [locationError, setLocationError] = React.useState('')
    const [isBuy, setIsBuy] = React.useState(true)
    const [priceListed, setPriceListed] = React.useState(8)
    const [priceInput, setPriceInput] = React.useState(8)
    const [priceError, setPriceError] = React.useState('')
    const [timeListed, setTimeListed] = React.useState(undefined)
    const [timeInput, setTimeInput] = React.useState(undefined)
    const [timeError, setTimeError] = React.useState('')


    async function update_query(recentlySet={}){
        let body = {
            locations: filteredLocations,
            price_range: {
                price_min: lowerPrice,
                price_max: upperPrice
            },
            time_range: {
                time_min: startTimeFilter,
                time_max: endTimeFilter
            },
            selling: showBuys,
            sort: {
                order_by: sortKey,
                asc: asc
            }
        };
        if(recentlySet["locations"] !== undefined && recentlySet["locations"] !== "undefined"){
            body["locations"] = recentlySet["locations"]
        }else if(recentlySet["locations"] === "undefined"){
            body["locations"] = undefined
        }
        if(recentlySet["price_min"] !== undefined && recentlySet["price_min"] !== "undefined"){
            body.price_range["price_min"] = recentlySet["price_min"]
        }else if(recentlySet["price_min"] === "undefined"){
            body.price_range["price_min"] = undefined
        }
        if(recentlySet["price_max"] !== undefined && recentlySet["price_max"] !== "undefined"){
            body.price_range["price_max"] = recentlySet["price_max"]
        }else if(recentlySet["price_max"] === "undefined"){
            body.price_range["price_max"] = undefined
        }
        if(recentlySet["time_min"] !== undefined && recentlySet["time_min"] !== "undefined"){
            body.time_range["time_min"] = recentlySet["time_min"]
        }else if(recentlySet["time_min"] === "undefined"){
            body.time_range["time_min"] = undefined
        }
        if(recentlySet["time_max"] !== undefined && recentlySet["time_max"] !== "undefined"){
            body.time_range["time_max"] = recentlySet["time_max"]
        }else if(recentlySet["time_max"] === "undefined"){
            body.time_range["loctime_maxations"] = undefined
        }
        if(recentlySet["showBuys"] !== undefined && recentlySet["showBuys"] !== "undefined"){
            body["showBuys"] = recentlySet["showBuys"]
        }else if(recentlySet["showBuys"] === "undefined"){
            body["showBuys"] = undefined
        }
        if(recentlySet["sortKey"] !== undefined && recentlySet["sortKey"] !== "undefined"){
            body.sort["order_by"] = recentlySet["sortKey"]
        }else if(recentlySet["sortKey"] === "undefined"){
            body.sort["order_by"] = undefined
        }
        if(recentlySet["asc"] !== undefined && recentlySet["asc"] !== "undefined"){
            body.sort["asc"] = recentlySet["asc"]
        }else if(recentlySet["asc"] === "undefined"){
            body.sort["asc"] = undefined
        }
        if(recentlySet["showBuys"] !== undefined && recentlySet["showBuys"] !== "undefined"){
            body["selling"] = recentlySet["showBuys"]
        }else if(recentlySet["showBuys"] === "undefined"){
            body["selling"] = undefined
        }
        console.log("Body being sent: ", body);
        let response = (await makeRequest('/get-listings', body)).data;
        if(Array.isArray(response)){
             setAllData(response);
        }else{
            setAllData([]);
        }
        setIndex(0);
    }

    async function make_listing(){
        let date = curr_date();
        let body = {
            location: locationListed,
            time: timeListed,
            price: priceListed,
            time_posted: date,
            resolved: false,
            selling: !isBuy
        };
        makeRequest('/post-listing', body);
    }
    
    return <>
        <div className="wrapper">
        <div className="div_class">
                <BuyButton buy={showBuys} callback={setShowBuys} update_query={update_query}/>
                <SellButton buy={showBuys} callback={setShowBuys} update_query={update_query}/>
                <FilterButton callback={() => setShowFilter(!showFilter)}/>
                <CreateListingButton callback={() => setShowPopup(!showPopup)}/>
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
            update_query={update_query}/> : <></>}
        </div>
        
        <div>
            <Grid sortKey={sortKey} setSortKey={setSortKey} asc={asc} setAsc={setAsc} all_data={all_data} update_query={update_query} index={index} setIndex={setIndex}/>
        </div>
        </div>
        <div>
            {/* {showPopup ? <Popup content="Some text" handleClose={() => setShowPopup(!showPopup)}/> : <></>} */}
            {showPopup ? <Popup stage={stage} setStage={setStage} 
            locationListed={locationListed} setLocationListed={setLocationListed}
            locationError={locationError} setLocationError={setLocationError}
            isBuy={isBuy} setIsBuy={setIsBuy}
            priceListed={priceListed} setPriceListed={setPriceListed}
            priceInput={priceInput} setPriceInput={setPriceInput}
            priceError={priceError} setPriceError={setPriceError}
            timeListed={timeListed} setTimeListed={setTimeListed}
            timeInput={timeInput} setTimeInput={setTimeInput}
            timeError={timeError} setTimeError={setTimeError}
            showPopup={showPopup} setShowPopup={setShowPopup}
            make_listing={make_listing}/> : <></>}
        </div>
    </>
}


let email;
function main2(signedIn){
    email = signedIn.email;
    root.render(React.createElement(main));
}
signInQueue.push(main2);
const rootNode = document.getElementById('market-root');
const root = ReactDOM.createRoot(rootNode);
