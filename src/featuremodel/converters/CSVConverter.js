export function CSVConverter() { }

CSVConverter.prototype.csvToFeatures = function(csv, simple, fieldSeparator, textDelimiter, featureType) {
    var features = [];
    var lines = this.csvToLines(csv, simple, fieldSeparator, textDelimiter);
    var feature = null;
    var errorLines = [];
    for (var i = 0; i < lines.length; i++) {
        try {
            feature = this.lineToFeature(lines[i], featureType);
            features.push(feature);
        } catch (e) {
            errorLines.push(i);
        }
    }
    
    if (errorLines.length > 0) {
        throw new Error("Could not convert " + errorLines.length + " out of " + lines.length + " csv lines to features. Error lines: " + errorLines);
    }
    
    return features;
}

CSVConverter.prototype.csvToLines = function(csv, simple, fieldSeparator, textDelimiter) {
    csv = csv.replace(new RegExp("^\\s+"), "").replace(new RegExp("\\s+$"), ""); 
    if (simple) {
        lines = csv.split("\n");
        for (var h = 0; h < lines.length; h++) {
            lines[h] = lines[h].split(fieldSeparator);
        }
    } else {
        var endOfFile = false;
        var endOfLine = false;
        var i = -1;
        var j = -1;
        var fields = [];
        var lines = [];
        while (!endOfFile) {
            endOfLine = false;
            while (!endOfLine) {
                if (csv.indexOf(textDelimiter) == 0) {
                    csv = csv.substring(textDelimiter.length);
                    i = csv.search(new RegExp(textDelimiter + "($|\n|" + fieldSeparator + ")"));
                    j = i + textDelimiter.length;
                } else {
                    i = csv.search(new RegExp("($|\n|" + fieldSeparator + ")"));
                    j = i;
                }
                fields.push(csv.substring(0, i));
                csv = csv.substring(j);
                if (csv.indexOf(fieldSeparator) == 0) {
                    csv = csv.substring(fieldSeparator.length);
                } else if (csv.indexOf("\n") == 0) {
                    csv = csv.substring(1);
                    lines.push(fields);
                    fields = [];
                    endOfLine = true;
                } else if (csv.length == 0) {
                    lines.push(fields);
                    endOfFile = true;
                    endOfLine = true;
                }
            }
        }
    }
    
    return lines;
}

CSVConverter.prototype.lineToFeature = function(fields, featureType) {
    var properties = featureType.properties;
    if (fields.length != properties.length) {
        throw new Error("Number of fields of " + fields.length + " in the csv does not match the number of properties of " + properties.length + " in the featuretype.");
    }
    
    var propertyValues = [];
    var wktConverter = new WKTConverter();
    for (var i = 0; i < properties.length; i++) {
        if (fields[i] == "") {
            propertyValues.push(null);
        } else if (properties[i].type == PropertyType.prototype.GEOMETRY) {
            propertyValues.push(wktConverter.wktToGeometry(fields[i]));
        } else {
            propertyValues.push(fields[i]);
        }
    }
    
    return new Feature(featureType, propertyValues);
}
