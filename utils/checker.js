export const isEmpty = (value) => {
    for (let key in value) {
        return false;
    } 
    
    return true;
}