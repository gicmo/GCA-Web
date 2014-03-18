/**
 * Module for misc utility functions
 * @module {models}
 */
define(["lib/tools"], function(tools) {
    "use strict";

    /**
     * Get a property value from another object. Tries to retrieve the underscore
     * variant of name first.
     *
     * @param {string} name     The name of a property.
     * @param {object} source   The source object from where to read the
     *                          value.
     * @returns {*|null}
     * @private
     */
    function readProperty(name, source) {
        if (source === null) {
            return null;
        }

        var value = null,
            name_under = tools.toUnderscore(name);

        if (source.hasOwnProperty(name_under)) {
            value = source[name_under];
        } else if (source.hasOwnProperty(name)) {
            value = source[name];
        }

        return value;
    }

    /**
     * Base class for models.
     *
     * @param {string} [uuid]   The uuid of the model.
     *
     * @returns {Model}
     * @constructor
     */
    function Model(uuid) {

        if (tools.isGlobalOrUndefined(this)) {
            return new Model(uuid);
        }

        var self = this;

        self.uuid = uuid || null;


        self.toObject = function() {
            var prop,
                obj = {};

            for (prop in self) {
               if (self.hasOwnProperty(prop)) {
                   var value = self[prop];
                   if (tools.type(value) !== "function") {
                       obj[prop] = value;
                   } else if (value.name === "observable") {
                       obj[prop] = self[prop]();
                   }
               }
            }

            return obj;
        };

        /**
         * Turns the model object into a json string.
         *
         * @param {number|null} [indention] The indention level, null for no pretty
         *                                  print.
         *
         * @returns {string} JSON string.
         */
        self.toJSON = function(indention) {
            if (indention === undefined) {
                indention = indention || 4;
            }
            var obj = self.toObject();
            return JSON.stringify(obj, null, indention);
        };

    }

    /**
     * Create a model from a regular object.
     *
     * @param {object} source           The source object from which to create the model.
     * @param {function} constructor    Constructor of the model class.
     *
     * @returns The created model object.
     */
    Model.fromObject = function(source, constructor) {
        var prop,
            target = constructor();

        for (prop in target) {
            if (target.hasOwnProperty(prop)) {
                var value = readProperty(prop, source);

                if (value !== null) {
                    if (tools.type(target[prop]) !== "function") {
                        target[prop] = value;
                    } else if (target[prop].name === "observable") {
                        target[prop](value);
                    }
                }
            }
        }

        return target;
    };

    /**
     * Create an array of model objects from an array of ordinary objects.
     *
     * @param {Array} array         The source array.
     * @param {function} factory    A factory function that creates a model from an
     *                              object.
     *
     * @returns {Array} Array with created model objects.
     */
    Model.fromArray = function(array, factory) {
        array = array || [];
        var created = [];

        array.forEach(function(obj) {
           created.push(factory(obj));
        });

        return created;
    };


    /**
     * Model for AbstractGroup
     *
     * @param {string} [uuid]
     * @param {number} [prefix]
     * @param {string} [name]
     * @param {string} [short]
     *
     * @returns {AbstractGroup}
     * @constructor
     * @public
     */
    function AbstractGroup(uuid, prefix, name, short) {

        if (! (this instanceof  AbstractGroup)) {
            return new AbstractGroup(uuid, prefix, name, short);
        }

        var self = tools.inherit(this, Model, uuid);

        self.prefix = prefix || 0;
        self.name = name || null;
        self.short = short || null;
    }

    AbstractGroup.fromObject = function(obj) {
        return Model.fromObject(obj, AbstractGroup);
    };

    AbstractGroup.fromArray = function(array) {
        return Model.fromArray(array, AbstractGroup.fromObject);
    };

    /**
     * Model for conference.
     *
     * @param {string}  [uuid]   The uuid of the conference.
     * @param {string}  [name]   The name of the conference.
     * @param {string}  [short]
     * @param {string}  [cite]
     * @param {string}  [link]
     * @param {boolean} [isOpen]
     * @param {Array}   [groups] List of {AbstractGroups}
     * @param {string}  [owners] URL to all abstract owners.
     * @param {string}  [abstracts] The URL to all abstracts.
     *
     * @returns {Conference}
     * @constructor
     * @public
     */
    function Conference(uuid, name, short, cite, link, isOpen, groups, owners, abstracts) {

        if (! (this instanceof Conference)) {
            return new Conference(uuid, name, short, cite, link, isOpen, groups, owners, abstracts);
        }

        var self = tools.inherit(this, Model, uuid);

        self.name = name || null;
        self.short = short || null;
        self.cite = cite || null;
        self.link = link || null;
        self.isOpen = isOpen || false;
        self.groups = groups || null;
        self.owners = owners || null;
        self.abstracts = abstracts || null;

        self.toObject = function() {
            var prop,
                obj = {};

            for (prop in self) {
                if (self.hasOwnProperty(prop)) {
                    var value = self[prop];

                    if (prop === "groups") {
                        obj.groups = [];
                        self.groups.forEach(appendGroup);
                    } else if (tools.type(value) !== "function") {
                        obj[prop] = value;
                    }
                }
            }

            function appendGroup(model) {
                obj.groups.push(model.toObject());
            }

            return obj;
        };

    }

    Conference.fromObject = function(obj) {
        var prop,
            target = new Conference();

        for (prop in target) {
            if (target.hasOwnProperty(prop)) {
                var value = readProperty(prop, obj);

                if (prop === "groups") {
                    target.groups = AbstractGroup.fromArray(value);
                } else if (tools.type(target[prop]) !== "function") {
                        target[prop] = value;
                }
            }
        }

        return target;
    };

    Conference.fromArray = function(array) {
        return Model.fromArray(array, Conference.fromObject);
    };

    /**
     * Model for authors.
     *
     * @param {string} [uuid]
     * @param {string} [mail]
     * @param {string} [firstName]
     * @param {string} [middleName]
     * @param {string} [lastName]
     * @param {number} [position]
     * @param {string} [affiliations]   Array with affiliation uuids.
     *
     * @returns {Author}
     * @constructor
     * @public
     */
    function Author(uuid, mail, firstName, middleName, lastName, position, affiliations) {

        if (! (this instanceof Author)) {
            return new Author(uuid, mail, firstName, middleName, lastName, position,
                              affiliations);
        }

        var self = tools.inherit(this, Model, uuid);

        self.mail = mail || null;
        self.firstName = firstName || null;
        self.middleName = middleName || null;
        self.lastName = lastName || null;
        self.position = position || 0;

        self.affiliations = affiliations || null;

        self.formatName = function() {
            var middle = self.middleName ? self.middleName + " " : "";
            return self.firstName + " " + middle + self.lastName;
        };

    }

    Author.fromObject = function(obj) {
        return Model.fromObject(obj, Author);
    };

    Author.fromArray = function(array) {
        return Model.fromArray(array, Author.fromObject);
    };


    /**
     * Observable model for authors.
     *
     * @param {string} [uuid]
     * @param {string} [mail]
     * @param {string} [firstName]
     * @param {string} [middleName]
     * @param {string} [lastName]
     * @param {number} [position]
     * @param {string} [affiliations]   Array with affiliation uuids.
     *
     * @returns {ObservableAuthor}
     * @constructor
     * @public
     */
    function ObservableAuthor(uuid, mail, firstName, middleName, lastName, position,
                              affiliations) {

        if (! (this instanceof ObservableAuthor)) {
            return new ObservableAuthor(uuid, mail, firstName, middleName,
                                        lastName, position, affiliations);
        }

        var self = tools.inherit(this, Model, uuid);

        self.mail = ko.observable(mail || null);
        self.firstName = ko.observable(firstName || null);
        self.middleName = ko.observable(middleName || null);
        self.lastName = ko.observable(lastName || null);
        self.position = ko.observable(position || 0);

        self.affiliations = ko.observableArray(affiliations || []);

        self.formatName = function() {
            var middle = self.middleName() ? self.middleName() + " " : "";
            return self.firstName() + " " + middle + self.lastName();
        };

        self.formatAffiliations = function() {
            var formatted = [];

            self.affiliations().forEach(function(pos, i) {
                formatted[i] = pos + 1;
            });

            return formatted.sort().join(", ");
        };

    }

    ObservableAuthor.fromObject = function(obj) {
        return Model.fromObject(obj, ObservableAuthor);
    };

    ObservableAuthor.fromArray = function(array) {
        return Model.fromArray(array, ObservableAuthor.fromObject);
    };

    /**
     * Model for affiliation
     *
     * @param {string} [uuid]
     * @param {string} [address]
     * @param {string} [country]
     * @param {string} [department]
     * @param {string} [name]
     * @param {string} [section]
     * @param {number} [position]
     *
     * @returns {Affiliation}
     * @constructor
     * @public
     */
    function Affiliation(uuid, address, country, department, name, section, position) {

        if (! (this instanceof  Affiliation)) {
            return new Affiliation(uuid, address, country, department, name, section,
                                   position);
        }

        var self = tools.inherit(this, Model, uuid);

        self.address = address || null;
        self.country = country || null;
        self.department = department || null;
        self.name = name || null;
        self.section = section || null;
        self.position = position || 0;

        self.format = function() {
            var str =(self.name || "")
                .concat(self.section ? ", " + self.section : "")
                .concat(self.department ? ", " + self.department : "")
                .concat(self.address ? ", " + self.address : "")
                .concat(self.country ? ", " + self.country : "");

            if (str.indexOf(", ") === 0) {
                str = str.slice(2, str.length);
            }

            return str;
        };

    }

    Affiliation.fromObject = function(obj) {
        return Model.fromObject(obj, Affiliation);
    };

    Affiliation.fromArray = function(array) {
        return Model.fromArray(array, Affiliation.fromObject);
    };


    /**
     * Obervable model for affiliation
     *
     * @param {string} [uuid]
     * @param {string} [address]
     * @param {string} [country]
     * @param {string} [department]
     * @param {string} [name]
     * @param {string} [section]
     * @param {number} [position]
     *
     * @returns {ObservableAffiliation}
     * @constructor
     * @public
     */
    function ObservableAffiliation(uuid, address, country, department, name, section,
                                   position) {

        if (! (this instanceof  ObservableAffiliation)) {
            return new ObservableAffiliation(uuid, address, country, department,
                                             name, section, position);
        }

        var self = tools.inherit(this, Model, uuid);

        self.address = ko.observable(address || null);
        self.country = ko.observable(country || null);
        self.department = ko.observable(department || null);
        self.name = ko.observable(name || null);
        self.section = ko.observable(section || null);
        self.position = ko.observable(position || 0);

        self.format = function() {
            var str =(self.name() || "")
                .concat(self.section() ? ", " + self.section() : "")
                .concat(self.department() ? ", " + self.department() : "")
                .concat(self.address() ? ", " + self.address() : "")
                .concat(self.country() ? ", " + self.country() : "");

            if (str.indexOf(", ") === 0) {
                str = str.slice(2, str.length);
            }

            return str;
        };

    }

    ObservableAffiliation.fromObject = function(obj) {
        return Model.fromObject(obj, ObservableAffiliation);
    };

    ObservableAffiliation.fromArray = function(array) {
        return Model.fromArray(array, ObservableAffiliation.fromObject);
    };
    
    

    /**
     * Model for figure.
     *
     * @param {string} [uuid]
     * @param {string} [name]
     * @param {string} [caption]
     * @param {string} [file]       URL to the image file.
     *
     * @returns {Figure}
     * @constructor
     * @public
     */
    function Figure(uuid, name, caption, file) {

        if (! (this instanceof Figure)) {
            return new Figure(uuid, name, caption, file);
        }

        var self = tools.inherit(this, Model, uuid);

        self.name = name || null;
        self.caption = caption || null;
        self.file = caption || null;

    }

    Figure.fromObject = function(obj) {
        return Model.fromObject(obj, Figure);
    };

    Figure.fromArray = function(array) {
        return Model.fromArray(array, Figure.fromObject);
    };

    /**
     * Observable model for figure.
     *
     * @param {string} [uuid]
     * @param {string} [name]
     * @param {string} [caption]
     * @param {string} [file]       URL to the image file.
     *
     * @returns {ObservableFigure}
     * @constructor
     * @public
     */
    function ObservableFigure(uuid, name, caption, file) {

        if (! (this instanceof ObservableFigure)) {
            return new ObservableFigure(uuid, name, caption, file);
        }

        var self = tools.inherit(this, Model, uuid);

        self.name = ko.observable(name || null);
        self.caption = ko.observable(caption || null);
        self.file = ko.observable(caption || null);

    }

    ObservableFigure.fromObject = function(obj) {
        return Model.fromObject(obj, ObservableFigure);
    };

    ObservableFigure.fromArray = function(array) {
        return Model.fromArray(array, ObservableFigure.fromObject);
    };

    /**
     * Model for reference.
     *
     * @param {string} [uuid]
     * @param {string} [authors]
     * @param {string} [title]
     * @param {string} [year]
     * @param {string} [doi]
     *
     * @returns {Reference}
     * @constructor
     * @public
     */
    function Reference(uuid, authors, title, year, doi) {

        if (! (this instanceof Reference)) {
            return new Reference();
        }

        var self = tools.inherit(this, Model, uuid);

        self.authors = authors || null;
        self.title = title || null;
        self.year = year || null;
        self.doi = doi || null;

    }

    Reference.fromObject = function(obj) {
        return Model.fromObject(obj, Reference);
    };

    Reference.fromArray = function(array) {
        return Model.fromArray(array, Reference.fromObject);
    };


    /**
     * Observable model for reference.
     *
     * @param {string} [uuid]
     * @param {string} [authors]
     * @param {string} [title]
     * @param {string} [year]
     * @param {string} [doi]
     *
     * @returns {ObservableReference}
     * @constructor
     * @public
     */
    function ObservableReference(uuid, authors, title, year, doi) {

        if (! (this instanceof ObservableReference)) {
            return new ObservableReference();
        }

        var self = tools.inherit(this, Model, uuid);

        self.authors = ko.observable(authors || null);
        self.title = ko.observable(title || null);
        self.year = ko.observable(year || null);
        self.doi = ko.observable(doi || null);

        self.format = function() {
            var str =(self.authors() || "")
                .concat(self.title() ? " " + self.title() : "")
                .concat(self.year() ? " (" + self.year() + ")" : "")
                .concat(self.doi() ? ", " + self.doi() : "");

            return str;
        };

    }

    ObservableReference.fromObject = function(obj) {
        return Model.fromObject(obj, ObservableReference);
    };

    ObservableReference.fromArray = function(array) {
        return Model.fromArray(array, ObservableReference.fromObject);
    };


    /**
     * Model for abstracts.
     *
     * @param {string} [uuid]
     * @param {number} [sortId]
     * @param {string} [title]
     * @param {string} [topic]
     * @param {string} [text]
     * @param {string} [doi]
     * @param {string} [conflictOfInterest]
     * @param {string} [acknowledgements]
     * @param {string} [owners]     URL to abstract owners.
     * @param {string} [state]
     * @param {Array} [figures]
     * @param {Array} [authors]
     * @param {Array} [affiliations]
     * @param {Array} [references]
     *
     * @returns {Abstract}
     * @constructor
     * @public
     */
    function Abstract(uuid, sortId, title, topic, text, doi, conflictOfInterest, acknowledgements,
                      owners, state, figures, authors, affiliations,
                      references) {

        if (! (this instanceof Abstract)) {
            return new Abstract(uuid, sortId, title, topic, text, doi, conflictOfInterest,
                                acknowledgements, state, owners, figures,
                                authors, affiliations, references);
        }

        var self = tools.inherit(this, Model, uuid);

        self.sortId = sortId || 0;
        self.title = title || null;
        self.topic = topic || null;
        self.text = text || null;
        self.doi = doi || null;
        self.conflictOfInterest = conflictOfInterest || null;
        self.acknowledgements = acknowledgements || null;
        self.owners = owners || null;
        self.state = state || "InPreparation";
        self.figures = figures || [];
        self.authors = authors || [];
        self.affiliations = affiliations || [];
        self.references = references || [];


        self.toObject = function() {
            var prop,
                obj = {};

            for (prop in self) {
                if (self.hasOwnProperty(prop)) {
                    var value = self[prop];

                    switch(prop) {
                        case "authors":
                            obj.authors = [];
                            self.authors.forEach(appendAuthor);
                            break;
                        case "affiliations":
                            obj.affiliations = [];
                            self.affiliations.forEach(appendAffiliation);
                            break;
                        case "references":
                            obj.references = [];
                            self.references.forEach(appendReference);
                            break;
                        case "owners":
                            break;
                        case "figures":
                            break;
                        default:
                            if (tools.type(value) !== "function") {
                                obj[prop] = value;
                            }
                    }
                }
            }

            function appendAuthor(model) {
                obj.authors.push(model.toObject());
            }

            function appendAffiliation(model) {
                obj.affiliations.push(model.toObject());
            }

            function appendReference(model) {
                obj.references.push(model.toObject());
            }

            return obj;
        };

    }

    Abstract.fromObject = function(obj) {
        var prop,
            target = new Abstract();

        for (prop in target) {
            if (target.hasOwnProperty(prop)) {
                var value = readProperty(prop, obj);

                switch(prop) {
                    case "figures":
                        target.figures = Figure.fromArray(value);
                        break;
                    case "authors":
                        target.authors = Author.fromArray(value);
                        break;
                    case "affiliations":
                        target.affiliations = Affiliation.fromArray(value);
                        break;
                    case "references":
                        target.references = Reference.fromArray(value);
                        break;
                    default:
                        if (tools.type(target[prop]) !== "function") {
                            target[prop] = value;
                        }
                }
            }
        }

        return target;
    };

    Abstract.fromArray = function(array) {
        return Model.fromArray(array, Abstract.fromObject);
    };


    /**
     * Observable model for abstracts.
     *
     * @param {string} [uuid]
     * @param {string} [title]
     * @param {string} [topic]
     * @param {string} [text]
     * @param {string} [doi]
     * @param {string} [conflictOfInterest]
     * @param {string} [acknowledgements]
     * @param {string} [owners]     URL to abstract owners.
     * @param {string} [state]
     * @param {Array} [figures]
     * @param {Array} [authors]
     * @param {Array} [affiliations]
     * @param {Array} [references]
     *
     * @returns {ObservableAbstract}
     * @constructor
     * @public
     */
    function ObservableAbstract(uuid, title, topic, text, doi, conflictOfInterest,
                                acknowledgements, owners, state, figures,
                                authors, affiliations, references) {

        if (! (this instanceof ObservableAbstract)) {
            return new ObservableAbstract(uuid, title, topic, text, doi,
                conflictOfInterest, acknowledgements, state, owners,
                figures, authors, affiliations, references);
        }

        var self = tools.inherit(this, Model, uuid);

        self.title = ko.observable(title || null);
        self.topic = ko.observable(topic || null);
        self.text = ko.observable(text || null);
        self.doi = ko.observable(doi || null);
        self.conflictOfInterest = ko.observable(conflictOfInterest || null);
        self.acknowledgements = ko.observable(acknowledgements || null);
        self.owners = ko.observable(owners || null);
        self.state = ko.observable(state || "InPreparation");
        self.figures = ko.observableArray(figures || []);
        self.authors = ko.observableArray(authors || []);
        self.affiliations = ko.observableArray(affiliations || []);
        self.references = ko.observableArray(references || []);

        self.paragraphs = function() {
            var para = [];

            if (self.text()) {
                para = self.text().split('\n');
            }

            return para;
        };

        self.toObject = function() {
            var prop,
                obj = {};

            for (prop in self) {
                if (self.hasOwnProperty(prop)) {
                    var value = self[prop];

                    switch(prop) {
                        case "authors":
                            obj.authors = [];
                            self.authors().forEach(appendAuthor);
                            break;
                        case "affiliations":
                            obj.affiliations = [];
                            self.affiliations().forEach(appendAffiliation);
                            break;
                        case "references":
                            obj.references = [];
                            self.references().forEach(appendReference);
                            break;
                        case "owners":
                            break;
                        case "figures":
                            break;
                        default:
                            if (tools.type(value) !== "function") {
                                obj[prop] = value;
                            } else if (value.name === "observable") {
                                obj[prop] = value();
                            }
                    }
                }
            }

            function appendAuthor(model) {
                obj.authors.push(model.toObject());
            }

            function appendAffiliation(model) {
                obj.affiliations.push(model.toObject());
            }

            function appendReference(model) {
                obj.references.push(model.toObject());
            }

            return obj;
        };

    }

    ObservableAbstract.fromObject = function(obj) {
        var prop,
            target = new ObservableAbstract();

        for (prop in target) {
            if (target.hasOwnProperty(prop)) {
                var value = readProperty(prop, obj);

                switch(prop) {
                    case "figures":
                        target.figures(Figure.fromArray(value));
                        break;
                    case "authors":
                        target.authors(ObservableAuthor.fromArray(value));
                        break;
                    case "affiliations":
                        target.affiliations(ObservableAffiliation.fromArray(value));
                        break;
                    case "references":
                        target.references(ObservableReference.fromArray(value));
                        break;
                    default:
                        if (tools.type(target[prop]) !== "function") {
                            target[prop] = value;
                        } else if (target[prop].name === "observable") {
                            target[prop](value);
                        }
                }
            }
        }

        return target;
    };

    ObservableAbstract.fromArray = function(array) {
        return Model.fromArray(array, ObservableAbstract.fromObject);
    };



    return {
        Conference: Conference,
        Author: Author,
        ObservableAuthor: ObservableAuthor,
        Affiliation: Affiliation,
        ObservableAffiliation: ObservableAffiliation,
        Figure: Figure,
        ObservableFigure: ObservableFigure,
        Reference: Reference,
        ObservableReference: ObservableReference,
        Abstract: Abstract,
        ObservableAbstract: ObservableAbstract
    };
});
